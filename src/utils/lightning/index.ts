import { err, ok, Result } from '../result';
import lm, {
	THeader,
	TTransactionData,
	DefaultTransactionDataShape,
	TAccount,
} from '@synonymdev/react-native-ldk';
import ldk from '@synonymdev/react-native-ldk/dist/ldk';
import {
	getBlockHashFromHeight,
	getTransactions,
	getBlockHeader,
	getBlockHex,
} from '../wallet/electrum';
import {
	getMnemonicPhrase,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import Keychain from 'react-native-keychain';
import { TAvailableNetworks } from '../networks';
import { getStore } from '../../store/helpers';
import mmkvStorage from '../../store/mmkv-storage';
import * as bitcoin from 'bitcoinjs-lib';
import { header as defaultHeader } from '../../store/shapes/wallet';

const LDK_ACCOUNT_SUFFIX = 'ldkaccount';

/**
 * Used to spin-up LDK services.
 * In order, this method:
 * 1. Fetches and sets the genesis hash.
 * 2. Retrieves and sets the seed from storage.
 * 3. Starts ldk with the necessary params.
 * 5. Syncs LDK.
 */
export const setupLdk = async ({
	selectedNetwork,
}: {
	selectedNetwork: TAvailableNetworks;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		await ldk.reset();
		const genesisHash = await getBlockHashFromHeight({
			height: 0,
		});
		if (genesisHash.isErr()) {
			return err(genesisHash.error.message);
		}
		const account = await getAccount({});
		if (account.isErr()) {
			return err(account.error.message);
		}
		const lmStart = await lm.start({
			getBestBlock,
			genesisHash: genesisHash.value,
			setItem: mmkvStorage.setItem,
			getItem: mmkvStorage.getItem,
			account: account.value,
			getTransactionData,
		});

		if (lmStart.isErr()) {
			return err(lmStart.error.message);
		}

		const nodeIdRes = await ldk.nodeId();
		if (nodeIdRes.isErr()) {
			return err(nodeIdRes.error.message);
		}

		await lm.syncLdk();
		console.log(`Node ID: ${nodeIdRes.value}`);
		return ok(nodeIdRes.value);
	} catch (e) {
		return err(e.toString());
	}
};

/**
 * Use Keychain to save LDK name & seed to secure storage.
 * @param {string} name
 * @param {string} seed
 */
export const setAccount = async ({
	name,
	seed,
}: TAccount): Promise<boolean> => {
	try {
		if (!name) {
			name = getSelectedWallet();
		}
		name = `${name}${LDK_ACCOUNT_SUFFIX}`;
		const account: TAccount = {
			name,
			seed,
		};
		await Keychain.setGenericPassword(name, JSON.stringify(account), {
			service: name,
		});
		return true;
	} catch {
		return false;
	}
};

/**
 * Retrieve LDK account info from storage.
 * @param selectedWallet
 */
export const getAccount = async ({
	selectedWallet,
}: {
	selectedWallet?: string;
}): Promise<Result<TAccount>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const mnemonicPhrase = await getMnemonicPhrase(selectedWallet);
	if (mnemonicPhrase.isErr()) {
		return err(mnemonicPhrase.error.message);
	}
	const name = `${selectedWallet}${LDK_ACCOUNT_SUFFIX}`;
	try {
		let result = await Keychain.getGenericPassword({ service: name });
		if (result && result?.password) {
			// Return existing account.
			return JSON.parse(result?.password);
		} else {
			const defaultAccount = _getDefaultAccount(name, mnemonicPhrase.value);
			// Setup default account.
			await setAccount(defaultAccount);
			return ok(defaultAccount);
		}
	} catch (e) {
		console.log(e);
		const defaultAccount = _getDefaultAccount(name, mnemonicPhrase.value);
		return ok(defaultAccount);
	}
};
const _getDefaultAccount = (name, mnemonic): TAccount => {
	// @ts-ignore
	const ldkSeed = bitcoin.crypto.sha256(mnemonic).toString('hex');
	return {
		name,
		seed: ldkSeed,
	};
};

/**
 * Returns last known header information from storage.
 * @returns {Promise<THeader>}
 */
export const getBestBlock = async (
	selectedNetwork?: TAvailableNetworks,
): Promise<THeader> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	try {
		const header = getStore().wallet?.header[selectedNetwork];
		return header?.hash ? header : defaultHeader;
	} catch (e) {
		console.log(e);
		return defaultHeader;
	}
};

/**
 * Returns the transaction header, height and hex (transaction) for a given txid.
 * @param {string} txId
 * @returns {Promise<TTransactionData>}
 */
export const getTransactionData = async (
	txId: string = '',
): Promise<TTransactionData> => {
	let transactionData = DefaultTransactionDataShape;
	const data = [{ tx_hash: txId }];
	const response = await getTransactions({
		txHashes: data,
	});

	if (response.isErr()) {
		return transactionData;
	}
	const { confirmations, hex: hex_encoded_tx } = response.value.data[0].result;
	const header = getBlockHeader({});
	const currentHeight = header.height;
	let confirmedHeight = 0;
	if (confirmations) {
		confirmedHeight = currentHeight - confirmations + 1;
	}
	const hexEncodedHeader = await getBlockHex({
		height: confirmedHeight,
	});
	if (hexEncodedHeader.isErr()) {
		return transactionData;
	}
	return {
		header: hexEncodedHeader.value,
		height: confirmedHeight,
		transaction: hex_encoded_tx,
	};
};

/**
 * Returns the current LDK node id.
 * @returns {Promise<Result<string>>}
 */
export const getNodeId = async (): Promise<Result<string>> => {
	try {
		const nodeIdResponse = await ldk.nodeId();
		if (nodeIdResponse.isErr()) {
			return err(nodeIdResponse.error.message);
		}
		return ok(nodeIdResponse.value);
	} catch (e) {
		return err(e);
	}
};
