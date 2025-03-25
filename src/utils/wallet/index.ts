import net from 'net';
import tls from 'tls';
import ecc from '@bitcoinerlab/secp256k1';
import lm, { ldk } from '@synonymdev/react-native-ldk';
import { Result, err, ok } from '@synonymdev/result';
import {
	EAddressType,
	EAvailableNetworks,
	ECoinSelectPreference,
	EElectrumNetworks,
	IAddress,
	ICustomGetAddress,
	ICustomGetScriptHash,
	IFormattedTransaction,
	IFormattedTransactions,
	IGenerateAddressesResponse,
	IGetAddressResponse,
	IKeyDerivationPath,
	IRbfData,
	ISendTransaction,
	IUtxo,
	IWalletData,
	TGapLimitOptions,
	TKeyDerivationAccount,
	TKeyDerivationChange,
	TKeyDerivationCoinType,
	TKeyDerivationPurpose,
	TOnMessage,
	TServer,
	TTransactionMessage,
	Wallet,
} from 'beignet';
import type { Electrum } from 'beignet/dist/types/electrum';
import type { Transaction } from 'beignet/dist/types/transaction';
import { TGetTotalFeeObj, TStorage } from 'beignet/dist/types/types';
import type { Wallet as TWallet } from 'beignet/dist/types/wallet';
import { BIP32Factory } from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

import { receivedTxIds } from '../../storage';
import {
	generateNewReceiveAddress,
	getWalletData,
	setWalletData,
	updateExchangeRates,
} from '../../store/actions/wallet';
import {
	dispatch,
	getLightningStore,
	getSettingsStore,
	getStore,
	getWalletStore,
} from '../../store/helpers';
import {
	getDefaultGapLimitOptions,
	getDefaultWalletShape,
	getDefaultWalletStoreShape,
} from '../../store/shapes/wallet';
import { resetActivityState } from '../../store/slices/activity';
import { updateUi } from '../../store/slices/ui';
import { updateWallet } from '../../store/slices/wallet';
import { createWallet } from '../../store/slices/wallet';
import { TNode } from '../../store/types/lightning';
import {
	IWallet,
	IWallets,
	TKeyDerivationAccountType,
	TTransfer,
	TWalletName,
} from '../../store/types/wallet';
import { updateActivityList } from '../../store/utils/activity';
import { refreshOrdersList } from '../../store/utils/blocktank';
import { moveMetaIncTxTags } from '../../store/utils/metadata';
import { showNewOnchainTxPrompt } from '../../store/utils/ui';
import { appStateTracker } from '../appState';
import BitcoinActions from '../bitcoin-actions';
import { btcToSats } from '../conversion';
import { promiseTimeout } from '../helpers';
import i18n from '../i18n';
import { getKeychainValue, setKeychainValue } from '../keychain';
import {
	getLightningBalance,
	getLightningReserveBalance,
	refreshLdk,
} from '../lightning';
import { EAvailableNetwork, networks } from '../networks';
import { showToast } from '../notifications';
import { IGenerateAddresses, IGetAddress } from '../types';
import { BITKIT_WALLET_SEED_HASH_PREFIX } from './constants';
import { getBlockHeader } from './electrum';
import { getTransferForTx } from './transfer';

// Initialize app state tracking
appStateTracker.init();

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

let addressGenerator: BitcoinActions | undefined;
let globalWallet: TWallet | undefined;

export const setupAddressGenerator = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	mnemonic,
	bip39Passphrase,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	mnemonic?: string;
	bip39Passphrase?: string;
} = {}): Promise<Result<string>> => {
	try {
		if (!mnemonic) {
			const mnemonicResponse = await getMnemonicPhrase(selectedWallet);
			if (mnemonicResponse.isErr()) {
				return err(mnemonicResponse.error.message);
			}
			mnemonic = mnemonicResponse.value;
		}
		if (!bip39Passphrase) {
			bip39Passphrase = await getBip39Passphrase();
		}
		addressGenerator = new BitcoinActions({
			mnemonic,
			bip39Passphrase,
			selectedNetwork,
		});
		return ok('Address generator setup successfully.');
	} catch (e) {
		return err(e);
	}
};

/*
 * Wait for wallet to be ready
 */
export const waitForWallet = async (): Promise<TWallet> => {
	// Return the wallet when it's defined
	while (typeof globalWallet === 'undefined') {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
	return globalWallet;
};

export const refreshWallet = async ({
	onchain = true,
	lightning = true,
	scanAllAddresses = false, // If set to false, on-chain scanning will adhere to the gap limit (20).
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	onchain?: boolean;
	lightning?: boolean;
	scanAllAddresses?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string>> => {
	try {
		if (onchain) {
			await refreshBeignet(scanAllAddresses);
		}

		if (lightning) {
			await refreshLdk({ selectedWallet, selectedNetwork });
			await refreshOrdersList();
		}

		if (onchain || lightning) {
			updateActivityList();
			moveMetaIncTxTags();
		}

		return ok('');
	} catch (e) {
		return err(e);
	}
};

/**
 * Refreshes the on-chain wallet by calling the Beignet refreshWallet method.
 * Does not update the activity list info. Use the refreshWallet method with onchain set to true for that.
 * @async
 * @param {boolean} [scanAllAddresses] - If set to false, on-chain scanning will adhere to the saved gap limit.
 * @return {Promise<void>}
 */
const refreshBeignet = async (scanAllAddresses = false): Promise<void> => {
	// Read additional addresses from LDK. They are used for channel closure transactions.
	let additionalAddresses: undefined | string[];
	try {
		additionalAddresses = await lm.readAddressesFromFile();
	} catch (e) {
		console.error('Error reading additional addresses from LDK:', e);
	}

	const wallet = await getOnChainWalletAsync();

	const refreshWalletRes = await wallet.refreshWallet({
		scanAllAddresses,
		additionalAddresses,
	});
	if (refreshWalletRes.isErr()) {
		if (!appStateTracker.wasRecentlyInBackground()) {
			handleRefreshError(refreshWalletRes.error.message);
		}
	} else {
		// If refresh was successful, reset the throttled state.
		if (getStore().ui.isElectrumThrottled) {
			dispatch(updateUi({ isElectrumThrottled: false }));
		}
	}
	checkGapLimit();
};

const handleRefreshError = (msg: string): void => {
	// If the error is due to the batch limit being exceeded, show a toast and set the throttled state.
	if (msg.includes('Batch limit exceeded')) {
		showToast({
			type: 'warning',
			title: i18n.t('wallet:refresh_error_throttle_title'),
			description: i18n.t('wallet:refresh_error_throttle_description'),
		});
		dispatch(updateUi({ isElectrumThrottled: true }));
	} else {
		showToast({
			type: 'warning',
			title: i18n.t('wallet:refresh_error_title'),
			description: i18n.t('wallet:refresh_error_msg'),
		});
	}
};

/**
 * In the event we temporarily changed the gap limit in Beignet when restoring Bitkit, we need to reset it back to Bitkit's default/saved values.
 */
const checkGapLimit = (): void => {
	const wallet = getOnChainWallet();
	const savedGapLimitOptions = getGapLimitOptions();
	const beignetGapLimit = wallet.gapLimitOptions;
	if (
		beignetGapLimit.lookAhead !== savedGapLimitOptions.lookAhead ||
		beignetGapLimit.lookBehind !== savedGapLimitOptions.lookBehind
	) {
		wallet.updateGapLimit(savedGapLimitOptions);
	}
};

/**
 * Generates a series of addresses based on the specified params.
 * @async
 * @param {string} selectedWallet - Wallet ID
 * @param {number} [addressAmount] - Number of addresses to generate.
 * @param {number} [changeAddressAmount] - Number of changeAddresses to generate.
 * @param {number} [addressIndex] - What index to start generating addresses at.
 * @param {number} [changeAddressIndex] - What index to start generating changeAddresses at.
 * @param {string} [keyDerivationPath] - The path to generate addresses from.
 * @param {string} [addressType] - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 */
export const generateAddresses = async ({
	addressAmount = 10,
	changeAddressAmount = 10,
	addressIndex = 0,
	changeAddressIndex = 0,
	keyDerivationPath,
	addressType,
}: IGenerateAddresses): Promise<Result<IGenerateAddressesResponse>> => {
	try {
		const wallet = await getOnChainWalletAsync();
		return await wallet.generateAddresses({
			addressAmount,
			changeAddressAmount,
			addressIndex,
			changeAddressIndex,
			keyDerivationPath,
			addressType,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns private key for the provided address data.
 * @param {IAddress} addressData
 * @param {string} path
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Promise<Result<string>>}
 */
export const getPrivateKey = async ({
	addressData,
	selectedNetwork = getSelectedNetwork(),
}: {
	addressData?: IAddress;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	try {
		return await getPrivateKeyFromPath({
			path: addressData?.path,
			selectedNetwork,
		});
	} catch (e) {
		return err(e);
	}
};

export const getPrivateKeyFromPath = async ({
	path,
	selectedNetwork = getSelectedNetwork(),
}: {
	path?: string;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	if (!path) {
		return err('No address path specified.');
	}
	if (!addressGenerator) {
		const res = await setupAddressGenerator({
			selectedNetwork,
		});
		if (res.isErr()) {
			return err(res.error.message);
		}
		if (!addressGenerator) {
			return err('Unable to setup address generator.');
		}
	}
	return await addressGenerator.getPrivateKey({
		path,
		selectedNetwork,
	});
};

const slashtagsPrimaryKeyKeyChainName = (seedHash: string): string => {
	return `SLASHTAGS_PRIMARYKEY/${seedHash}`;
};

export const getSlashtagsPrimaryKey = async (
	seedHash: string,
): Promise<Result<string>> => {
	const key = slashtagsPrimaryKeyKeyChainName(seedHash);
	return getKeychainValue(key);
};

export const slashtagsPrimaryKey = async (seed: Buffer): Promise<string> => {
	const network = networks.bitcoin;
	const root = bip32.fromSeed(seed, network);

	// https://github.com/synonymdev/slashtags/blob/master/packages/sdk/lib/constants.js
	const path = "m/123456'";
	const keyPair = root.derivePath(path);

	return keyPair.privateKey?.toString('hex') as string;
};

const setKeychainSlashtagsPrimaryKey = async (seed: Buffer): Promise<void> => {
	const primaryKey = await slashtagsPrimaryKey(seed);
	await setKeychainValue({
		key: slashtagsPrimaryKeyKeyChainName(seedHash(seed)),
		value: primaryKey,
	});
};

export const seedHash = (seed: Buffer): string => {
	const prefix = new Uint8Array(BITKIT_WALLET_SEED_HASH_PREFIX);
	const seedArray = new Uint8Array(seed);
	const buffer = Buffer.concat([prefix, seedArray]);
	return bitcoin.crypto.sha256(buffer).toString('hex');
};

export const ldkSeed = async (
	mnemonic: string,
	bip39Passphrase: string,
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
): Promise<string> => {
	const mnemonicSeed = await bip39.mnemonicToSeed(mnemonic, bip39Passphrase);
	const network = networks[selectedNetwork];
	const root = bip32.fromSeed(mnemonicSeed, network);
	return root.privateKey!.toString('hex');
};

export const keyDerivationAccountTypes: {
	onchain: TKeyDerivationAccount;
} = {
	onchain: '0',
};

/**
 * Returns the account param of the key derivation path based on the specified account type.
 * @param {TKeyDerivationAccountType} [accountType]
 * @return {TKeyDerivationAccount}
 */
export const getKeyDerivationAccount = (
	accountType: TKeyDerivationAccountType = 'onchain',
): TKeyDerivationAccount => {
	return keyDerivationAccountTypes[accountType];
};

/**
 * Get onchain mnemonic phrase for a given wallet from storage.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @return {Promise<Result<string>>}
 */
export const getMnemonicPhrase = async (
	selectedWallet: TWalletName = getSelectedWallet(),
): Promise<Result<string>> => {
	return getKeychainValue(selectedWallet);
};

/**
 * Get bip39 passphrase for a specified wallet.
 * @async
 * @param {TWalletName} selectedWallet
 * @return {Promise<string>}
 */
export const getBip39Passphrase = async (
	selectedWallet: TWalletName = getSelectedWallet(),
): Promise<string> => {
	const key = `${selectedWallet}passphrase`;
	const result = await getKeychainValue(key);
	return result.isOk() ? result.value : '';
};

/**
 * Get scriptHash for a given address
 * @param {string} address
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {string}
 */
export const getScriptHash = async (
	address: string,
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
): Promise<string> => {
	try {
		if (!address) {
			return '';
		}
		if (!addressGenerator) {
			const res = await setupAddressGenerator({});
			if (res.isErr()) {
				return '';
			}
			if (!addressGenerator) {
				return '';
			}
		}
		const getScriptHashRes = await addressGenerator.getScriptHash({
			address,
			selectedNetwork,
		});
		if (getScriptHashRes.isErr()) {
			return '';
		}
		return getScriptHashRes.value;
	} catch {
		return '';
	}
};

/**
 * Get scriptHash for a given address
 * @param {string} address
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {string}
 */
export const getCustomScriptHash = async ({
	address,
	selectedNetwork,
}: ICustomGetScriptHash): Promise<string> => {
	try {
		if (!address) {
			return '';
		}
		if (!addressGenerator) {
			const res = await setupAddressGenerator({});
			if (res.isErr()) {
				return '';
			}
			if (!addressGenerator) {
				return '';
			}
		}
		const network = electrumNetworkToBitkitNetwork(selectedNetwork);
		return await getScriptHash(address, network);
	} catch {
		return '';
	}
};

export const electrumNetworkToBitkitNetwork = (
	network: EElectrumNetworks,
): EAvailableNetwork => {
	switch (network) {
		case EElectrumNetworks.bitcoin:
			return EAvailableNetwork.bitcoin;
		case EElectrumNetworks.bitcoinRegtest:
			return EAvailableNetwork.bitcoinRegtest;
		case EElectrumNetworks.bitcoinTestnet:
			return EAvailableNetwork.bitcoinTestnet;
	}
};

/**
 * Get address for a given keyPair, network and type.
 * @param {string} path
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {EAddressType} type - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 * @return {string}
 */
export const getAddress = async ({
	path,
	selectedNetwork = getSelectedNetwork(),
}: IGetAddress): Promise<Result<IGetAddressResponse>> => {
	if (!path) {
		return err('No path specified');
	}
	if (!addressGenerator) {
		const res = await setupAddressGenerator({});
		if (res.isErr()) {
			return err(res.error.message);
		}
		if (!addressGenerator) {
			return err('Unable to setup address generator.');
		}
	}
	return await addressGenerator.getAddress({
		path,
		selectedNetwork,
	});
};

/**
 * Get address for a given keyPair, network and type.
 * @param {string} path
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {EAddressType} type - Determines what type of address to generate (p2pkh, p2sh, p2wpkh).
 * @return {string}
 */
export const customGetAddress = async ({
	path,
	selectedNetwork,
}: ICustomGetAddress): Promise<Result<IGetAddressResponse>> => {
	if (!path) {
		return err('No path specified');
	}
	try {
		if (!addressGenerator) {
			const res = await setupAddressGenerator({});
			if (res.isErr()) {
				return err(res.error.message);
			}
			if (!addressGenerator) {
				return err('Unable to setup address generator.');
			}
		}
		const getAddrRes = await addressGenerator.getAddress({
			path,
			selectedNetwork: electrumNetworkToBitkitNetwork(selectedNetwork),
		});
		if (getAddrRes.isErr()) {
			return err(getAddrRes.error.message);
		}
		return getAddrRes;
	} catch (e) {
		return err(e);
	}
};

/**
 * Determine if a given mnemonic is valid.
 * @param {string} mnemonic - The mnemonic to validate.
 * @return {boolean}
 */
export const validateMnemonic = (mnemonic: string): boolean => {
	try {
		return bip39.validateMnemonic(mnemonic);
	} catch (error) {
		console.error('error validating mnemonic', error);
		return false;
	}
};

/**
 * Get the current Bitcoin balance in sats. (Confirmed+Unconfirmed)
 * @param {string} selectedWallet
 * @param {string} selectedNetwork
 * @return number - Will always return balance in sats.
 */
export const getOnChainBalance = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): number => {
	return getWalletStore().wallets[selectedWallet]?.balance[selectedNetwork];
};

/**
 * Returns the currently selected network.
 * @return {EAvailableNetwork}
 */
export const getSelectedNetwork = (): EAvailableNetwork => {
	return getWalletStore()?.selectedNetwork ?? 'bitcoin';
};

/**
 * Returns the currently selected address type (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType}
 */
export const getSelectedAddressType = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): EAddressType => {
	const storedWallet = getWalletStore().wallets[selectedWallet];
	if (storedWallet?.addressType[selectedNetwork]) {
		return storedWallet.addressType[selectedNetwork];
	}
	return getDefaultWalletShape().addressType[selectedNetwork];
};

/**
 * Returns the currently monitored address types (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType[]}
 */
export const getAddressTypesToMonitor = (): EAddressType[] => {
	return getWalletStore().addressTypesToMonitor;
};

/**
 * Returns the currently monitored address types (p2pkh | p2sh | p2wpkh | p2tr).
 * @returns {EAddressType[]}
 */
export const getGapLimitOptions = (): TGapLimitOptions => {
	return getWalletStore().gapLimitOptions;
};

/**
 * Returns the currently selected wallet (Ex: 'wallet0').
 * @return {TWalletName}
 */
export const getSelectedWallet = (): TWalletName => {
	return getWalletStore()?.selectedWallet ?? 'wallet0';
};

/**
 * Returns all state data for the currently selected wallet.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @return {{ currentWallet: IWallet, currentLightningNode: TNode, selectedWallet: TWalletName, selectedNetwork: EAvailableNetwork }}
 */
export const getCurrentWallet = ({
	selectedNetwork = getSelectedNetwork(),
	selectedWallet = getSelectedWallet(),
}: {
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
} = {}): {
	currentWallet: IWallet;
	currentLightningNode: TNode;
	selectedNetwork: EAvailableNetwork;
	selectedWallet: TWalletName;
} => {
	const walletStore = getWalletStore();
	const lightning = getLightningStore();
	const currentLightningNode = lightning.nodes[selectedWallet];
	const currentWallet = walletStore.wallets[selectedWallet];
	return {
		currentWallet,
		currentLightningNode,
		selectedNetwork,
		selectedWallet,
	};
};

export const getOnChainTransactions = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet: TWalletName;
	selectedNetwork: EAvailableNetwork;
}): IFormattedTransactions => {
	return (
		getWalletStore().wallets[selectedWallet]?.transactions[selectedNetwork] ??
		{}
	);
};

export const getTransfers = (): TTransfer[] => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();
	const currentWallet = getWalletStore().wallets[selectedWallet];
	const transfers = currentWallet.transfers[selectedNetwork];

	return transfers;
};

/**
 * @param {string} txid
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Result<IFormattedTransaction>}
 */
export const getTransactionById = ({
	txid,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Result<IFormattedTransaction> => {
	const transactions = getOnChainTransactions({
		selectedNetwork,
		selectedWallet,
	});
	if (txid in transactions) {
		return ok(transactions[txid]);
	}
	return err('Unable to locate the specified txid.');
};

export interface ITransaction<T> {
	id: number;
	jsonrpc: string;
	param: string;
	data: T;
	result: {
		blockhash?: string;
		confirmations?: number;
		hash: string;
		hex: string;
		locktime: number;
		size: number;
		txid: string;
		version: number;
		vin: IVin[];
		vout: IVout[];
		vsize: number;
		weight: number;
		blocktime?: number;
		time?: number;
	};
}

export interface ITxHash {
	tx_hash: string;
}

export const getCustomElectrumPeers = ({
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedNetwork?: EAvailableNetwork;
}): TServer[] => {
	return getSettingsStore().customElectrumPeers[selectedNetwork];
};

export interface IVin {
	scriptSig: {
		asm: string;
		hex: string;
	};
	sequence: number;
	txid: string;
	txinwitness: string[];
	vout: number;
}

export interface IVout {
	n: number; //0
	scriptPubKey: {
		addresses?: string[];
		address?: string;
		asm: string;
		hex: string;
		reqSigs?: number;
		type?: string;
	};
	value: number;
}

/**
 * Using a tx_hash this method will return the necessary data to create a
 * replace-by-fee transaction for any 0-conf, RBF-enabled tx.
 * @param txHash
 */
export const getRbfData = async ({
	txHash,
}: {
	txHash: ITxHash;
}): Promise<Result<IRbfData>> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.getRbfData({ txHash });
};

/**
 * Generates a newly specified wallet.
 * @param {string} [wallet]
 * @param {string} [mnemonic]
 * @param {string} [bip39Passphrase]
 * @param {EAddressType} [addressTypesToCreate]
 * @return {Promise<Result<IWallets>>}
 */
export const createDefaultWallet = async ({
	walletName,
	mnemonic,
	bip39Passphrase,
	restore,
	addressTypesToCreate = getDefaultWalletStoreShape().addressTypesToMonitor,
	selectedNetwork = getSelectedNetwork(),
	servers,
}: {
	walletName: TWalletName;
	mnemonic: string;
	bip39Passphrase: string;
	restore: boolean;
	addressTypesToCreate?: EAddressType[];
	selectedNetwork?: EAvailableNetwork;
	servers?: TServer | TServer[];
}): Promise<Result<IWallets>> => {
	try {
		const selectedAddressType = getSelectedAddressType();

		if (!bip39Passphrase) {
			bip39Passphrase = await getBip39Passphrase(walletName);
		}

		const wallets = getWalletStore().wallets;
		if (walletName in wallets && wallets[walletName]?.id) {
			const msg = i18n.t('wallet:create_wallet_existing_error', { walletName });
			console.error(msg);
			return err(msg);
		}
		if (!validateMnemonic(mnemonic)) {
			let msg = i18n.t('wallet:create_wallet_mnemonic_error');
			if (restore) {
				msg = i18n.t('wallet:create_wallet_mnemonic_restore_error');
			}
			console.error(msg);
			return err(msg);
		}
		await setKeychainValue({ key: walletName, value: mnemonic });

		if (bip39Passphrase) {
			await setKeychainValue({
				key: `${walletName}passphrase`,
				value: bip39Passphrase,
			});
		}

		const seed = await bip39.mnemonicToSeed(mnemonic, bip39Passphrase);
		await setKeychainSlashtagsPrimaryKey(seed);

		dispatch(
			createWallet({
				[walletName]: { ...getDefaultWalletShape(), seedHash: seedHash(seed) },
			}),
		);

		let gapLimitOptions = getDefaultGapLimitOptions();
		if (restore) {
			// Temporarily increase the gap limit to ensure all addresses are scanned.
			gapLimitOptions = {
				lookAhead: 20,
				lookBehind: 20,
				lookAheadChange: 10,
				lookBehindChange: 10,
			};
		}

		const defaultWalletShape = getDefaultWalletShape();
		const setupWalletRes = await setupOnChainWallet({
			name: walletName,
			selectedNetwork,
			bip39Passphrase: bip39Passphrase,
			addressType: selectedAddressType,
			servers,
			disableMessagesOnCreate: true,
			addressTypesToMonitor: addressTypesToCreate,
			gapLimitOptions,
		});
		if (setupWalletRes.isErr()) {
			return err(setupWalletRes.error.message);
		}
		checkGapLimit(); // Revert temporarily increased gap limit.
		const walletData = setupWalletRes.value.data;

		const payload: IWallets = {
			[walletName]: {
				...defaultWalletShape,
				seedHash: seedHash(seed),
				addressType: {
					bitcoin: selectedAddressType,
					bitcoinTestnet: selectedAddressType,
					bitcoinRegtest: selectedAddressType,
				},
				addressIndex: {
					...defaultWalletShape.addressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.addressIndex[selectedNetwork],
						...walletData.addressIndex,
					},
				},
				changeAddressIndex: {
					...defaultWalletShape.changeAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.changeAddressIndex[selectedNetwork],
						...walletData.changeAddressIndex,
					},
				},
				addresses: {
					...defaultWalletShape.addresses,
					[selectedNetwork]: {
						...defaultWalletShape.addresses[selectedNetwork],
						...walletData.addresses,
					},
				},
				changeAddresses: {
					...defaultWalletShape.changeAddresses,
					[selectedNetwork]: {
						...defaultWalletShape.changeAddresses[selectedNetwork],
						...walletData.changeAddresses,
					},
				},
				lastUsedAddressIndex: {
					...defaultWalletShape.lastUsedAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.lastUsedAddressIndex[selectedNetwork],
						...walletData.lastUsedAddressIndex,
					},
				},
				lastUsedChangeAddressIndex: {
					...defaultWalletShape.lastUsedChangeAddressIndex,
					[selectedNetwork]: {
						...defaultWalletShape.lastUsedChangeAddressIndex[selectedNetwork],
						...walletData.lastUsedChangeAddressIndex,
					},
				},
				transaction: {
					...defaultWalletShape.transaction,
					[selectedNetwork]: walletData.transaction,
				},
				transactions: {
					...defaultWalletShape.transactions,
					[selectedNetwork]: walletData.transactions,
				},
				unconfirmedTransactions: {
					...defaultWalletShape.unconfirmedTransactions,
					[selectedNetwork]: walletData.unconfirmedTransactions,
				},
				utxos: {
					...defaultWalletShape.utxos,
					[selectedNetwork]: walletData.utxos,
				},
				id: walletData.id,
			},
		};
		return ok(payload);
	} catch (e) {
		return err(e);
	}
};

// Only show the alert if no new connection has been established within 20 seconds.
const CONNECTION_ALERT_TIMEOUT = 20000;
let connectionAlertShown = false;
let connectionAlertTimeout: NodeJS.Timeout;
const onElectrumConnectionChange = (isConnected: boolean): void => {
	// get state fresh from store everytime
	const { isConnectedToElectrum } = getStore().ui;

	if (isConnectedToElectrum !== isConnected) {
		dispatch(updateUi({ isConnectedToElectrum: isConnected }));
	}

	if (!isConnectedToElectrum && isConnected && connectionAlertShown) {
		showToast({
			type: 'success',
			title: i18n.t('other:connection_restored_title'),
			description: i18n.t('other:connection_restored_message'),
		});
		connectionAlertShown = false;
	}

	if (isConnectedToElectrum && !isConnected) {
		clearTimeout(connectionAlertTimeout);
		connectionAlertTimeout = setTimeout(() => {
			const { isConnectedToElectrum: isConnectedToElectrum2 } = getStore().ui;
			if (isConnectedToElectrum2) {
				// If the connection has been re-established, don't show the alert.
				return;
			}
			showToast({
				type: 'warning',
				title: i18n.t('other:connection_reconnect_title'),
				description: i18n.t('other:connection_reconnect_msg'),
			});
			connectionAlertShown = true;
		}, CONNECTION_ALERT_TIMEOUT);
	}
};

const onMessage: TOnMessage = async (key, data): Promise<void> => {
	switch (key) {
		case 'transactionReceived': {
			const txMsg = data as TTransactionMessage;
			const wallet = await getOnChainWalletAsync();
			if (
				wallet?.isSwitchingNetworks !== undefined &&
				!wallet?.isSwitchingNetworks
			) {
				const { transaction } = txMsg;
				const isDuplicate = receivedTxIds.has(transaction.txid);
				const transfer = await getTransferForTx(transaction);

				if (!transfer && !isDuplicate) {
					showNewOnchainTxPrompt({
						id: transaction.txid,
						value: btcToSats(transaction.value),
					});
					receivedTxIds.add(transaction.txid);
				}
			}
			refreshWallet({ lightning: false }).then();
			setTimeout(updateActivityList, 500);
			break;
		}
		case 'transactionSent': {
			setTimeout(updateActivityList, 500);
			break;
		}
		case 'connectedToElectrum': {
			onElectrumConnectionChange(data as boolean);
			break;
		}
		case 'reorg': {
			const utxoArr = data as IUtxo[];
			// Only notify users of reorg's that impact their transactions.
			if (utxoArr.length) {
				// Notify user that a reorg has occurred and that the transaction has been pushed back into the mempool.
				showToast({
					type: 'info',
					title: i18n.t('wallet:reorg_detected'),
					description: i18n.t('wallet:reorg_msg_begin', {
						count: utxoArr.length,
					}),
					autoHide: false,
				});
			}
			break;
		}
		case 'rbf': {
			const rbfData = data as string[];
			showToast({
				type: 'warning',
				title: i18n.t('wallet:activity_removed_title'),
				description: i18n.t('wallet:activity_removed_msg', {
					count: rbfData.length,
				}),
				autoHide: false,
			});
			break;
		}
		case 'newBlock': {
			// Beignet will handle this.
			refreshWallet({ onchain: false }).then();
		}
	}
};

export const setupOnChainWallet = async ({
	name = getSelectedWallet(),
	mnemonic,
	bip39Passphrase,
	selectedNetwork = getSelectedNetwork(),
	addressType = getSelectedAddressType(),
	setStorage = true,
	servers,
	disableMessagesOnCreate = false,
	addressTypesToMonitor = [addressType],
	gapLimitOptions = getDefaultGapLimitOptions(),
}: {
	name: TWalletName;
	mnemonic?: string;
	bip39Passphrase?: string;
	selectedNetwork?: EAvailableNetwork;
	addressType?: EAddressType;
	setStorage?: boolean;
	servers?: TServer | TServer[];
	disableMessagesOnCreate?: boolean;
	addressTypesToMonitor?: EAddressType[];
	gapLimitOptions?: TGapLimitOptions;
}): Promise<Result<Wallet>> => {
	// if wallet alrady exists, prepare it to be re-created
	await globalWallet?.stop();

	if (!mnemonic) {
		const mnemonicRes = await getMnemonicPhrase(name);
		if (mnemonicRes.isErr()) {
			return err(mnemonicRes.error.message);
		}
		mnemonic = mnemonicRes.value;
	}
	await setupAddressGenerator({
		mnemonic,
		bip39Passphrase,
		selectedWallet: name,
		selectedNetwork,
	});
	// Fetch any stored custom peers.
	const customPeers = servers ?? getCustomElectrumPeers({ selectedNetwork });
	let storage: TStorage | undefined;
	if (setStorage) {
		storage = {
			getData: getWalletData,
			setData: setWalletData,
		};
	}
	updateExchangeRates();
	const { coinSelectAuto, coinSelectPreference, rbf } = getSettingsStore();
	const createWalletResponse = await Wallet.create({
		rbf,
		name,
		mnemonic,
		onMessage,
		passphrase: bip39Passphrase,
		network: EAvailableNetworks[selectedNetwork],
		electrumOptions: {
			servers: customPeers,
			net,
			tls,
		},
		gapLimitOptions,
		storage,
		addressType,
		customGetAddress: customGetAddress,
		customGetScriptHash: getCustomScriptHash,
		disableMessagesOnCreate,
		addressTypesToMonitor,
		coinSelectPreference: coinSelectAuto
			? coinSelectPreference
			: ECoinSelectPreference.consolidate, // Use consolidate if manual coin control is enabled.
	});
	if (createWalletResponse.isErr()) {
		return err(createWalletResponse.error.message);
	}
	globalWallet = createWalletResponse.value;
	await globalWallet.refreshWallet({}); // wait for wallet to load it's balance
	return ok(globalWallet);
};

/**
 * Parses a key derivation path in string format Ex: "m/84'/0'/0'/0/0" and returns IKeyDerivationPath.
 * @param {string} keyDerivationPath
 * @param {TKeyDerivationPurpose | string} [purpose]
 * @param {boolean} [changeAddress]
 * @param {TKeyDerivationAccountType} [accountType]
 * @param {string} [addressIndex]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Result<IKeyDerivationPath>}
 */
export const getKeyDerivationPathObject = ({
	path = '',
	purpose,
	accountType,
	changeAddress,
	addressIndex,
	selectedNetwork,
}: {
	path: string;
	purpose?: TKeyDerivationPurpose;
	accountType?: TKeyDerivationAccountType;
	changeAddress?: boolean;
	addressIndex?: string;
	selectedNetwork?: EAvailableNetwork;
}): Result<IKeyDerivationPath> => {
	try {
		const parsedPath = path.replace(/'/g, '').split('/');

		if (!purpose) {
			purpose = parsedPath[1] as TKeyDerivationPurpose;
		}

		let coinType = parsedPath[2] as TKeyDerivationCoinType;
		if (selectedNetwork) {
			coinType =
				selectedNetwork.toLocaleLowerCase() === EAvailableNetworks.bitcoin
					? '0'
					: '1';
		}

		let account = parsedPath[3] as TKeyDerivationAccount;
		if (accountType) {
			account = getKeyDerivationAccount(accountType);
		}

		let change = parsedPath[4] as TKeyDerivationChange;
		if (changeAddress !== undefined) {
			change = changeAddress ? '1' : '0';
		}

		if (!addressIndex) {
			addressIndex = parsedPath[5];
		}

		return ok({
			purpose,
			coinType,
			account,
			change,
			addressIndex,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the next available receive address for the given network and wallet.
 * @param {EAddressType} [addressType]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @return {Result<string>}
 */
export const getReceiveAddress = async ({
	addressType,
	selectedNetwork = getSelectedNetwork(),
}: {
	addressType?: EAddressType;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	try {
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork });
		}
		const wallet = await getOnChainWalletAsync();
		const address = await wallet.getAddress({ addressType });
		return address ? ok(address) : err('Unable to get receive address.');
	} catch (e) {
		return err(e);
	}
};
/**
 * Returns the current addressIndex value and will create one if none existed.
 * @param {EAddressType} [addressType]
 * @return {Result<string>}
 */
export const getCurrentAddressIndex = async ({
	addressType,
}: {
	addressType?: EAddressType;
}): Promise<Result<IAddress>> => {
	try {
		const wallet = await getOnChainWalletAsync();
		addressType = addressType ?? wallet.addressType;
		const currentWallet = wallet.data;
		const addressIndex = currentWallet.addressIndex[addressType];
		const receiveAddress = currentWallet.addressIndex[addressType];
		if (receiveAddress) {
			return ok(receiveAddress);
		}
		const addresses = currentWallet?.addresses[addressType];

		// Check if addresses were generated, but the index has not been set yet.
		if (
			Object.keys(addresses).length > 0 &&
			addressIndex[addressType].index < 0
		) {
			// Grab and return the address at index 0.
			const address = Object.values(addresses).find(({ index }) => index === 0);
			if (address) {
				return ok(address);
			}
		}
		// Fallback to generating a new receive address on the fly.
		const generatedAddress = await generateNewReceiveAddress({
			addressType,
		});
		if (generatedAddress.isOk()) {
			return ok(generatedAddress.value);
		}
		console.log(generatedAddress.error.message);
		return err('No address index available.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves wallet balances for the currently selected wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getBalance = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<{
	onchainBalance: number; // Total onchain funds
	// lightningBalance: number; // Total lightning funds (spendable + reserved + claimable)
	spendingBalance: number; // Share of lightning funds that are spendable
	reserveBalance: number; // Share of lightning funds that are locked up in channels
	// claimableBalance: number; // Funds that will be available after a channel opens/closes
	spendableBalance: number; // Total spendable funds (onchain + spendable lightning)
	// totalBalance: number; // Total funds (all of the above)
}> => {
	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});

	const wallet = await getOnChainWalletAsync();
	const { localBalance } = getLightningBalance();
	const reserveBalance = getLightningReserveBalance();
	const spendingBalance = localBalance - reserveBalance;
	const onchainBalance =
		wallet.getBalance() ?? currentWallet.balance[selectedNetwork];
	// const lightningBalance = localBalance + claimableBalance;
	const spendableBalance = onchainBalance + spendingBalance;
	// const totalBalance = onchainBalance + lightningBalance;

	// check and re-add unused balance types when needed
	return {
		onchainBalance,
		// lightningBalance,
		spendingBalance,
		reserveBalance,
		// claimableBalance,
		spendableBalance,
		// totalBalance,
	};
};

/**
 * This method will clear the utxo array for each address type and reset the
 * address indexes back to the original/default app values. Once cleared & reset
 * the app will rescan the wallet's addresses from index zero.
 * @param {boolean} [shouldClearAddresses] - Clears and re-generates all addresses when true.
 * @param {boolean} [shouldClearTransactions]
 * @returns {Promise<Result<string>>}
 */
export const rescanAddresses = async ({
	shouldClearAddresses = true,
	shouldClearTransactions = false,
}: {
	shouldClearAddresses?: boolean;
	shouldClearTransactions?: boolean;
}): Promise<Result<IWalletData>> => {
	const wallet = await getOnChainWalletAsync();
	const res = await wallet.rescanAddresses({
		shouldClearAddresses,
		shouldClearTransactions,
	});
	if (res.isErr()) {
		handleRefreshError(res.error.message);
		return err(res.error.message);
	}
	return res;
};

/**
 * Returns the number of confirmations for a given block height.
 * @param {number} height
 * @param {number} [currentHeight]
 * @returns {number}
 */
export const blockHeightToConfirmations = ({
	blockHeight,
	currentHeight,
}: {
	blockHeight?: number;
	currentHeight?: number;
}): number => {
	if (!blockHeight) {
		return 0;
	}
	if (!currentHeight) {
		const header = getBlockHeader();
		currentHeight = header.height;
	}
	if (currentHeight < blockHeight) {
		return 0;
	}
	return currentHeight - blockHeight + 1;
};

/**
 * @deprecated Use getOnChainWalletAsync instead.
 */
export const getOnChainWallet = (): Wallet => {
	if (!globalWallet) {
		throw new Error('Beignet wallet not initialized.');
	}
	return globalWallet;
};

export const getOnChainWalletAsync = async (): Promise<Wallet> => {
	return waitForWallet();
};

/**
 * @deprecated Use getOnChainWalletTransactionAsync instead.
 */
export const getOnChainWalletTransaction = (): Transaction => {
	return getOnChainWallet().transaction;
};

export const getOnChainWalletTransactionAsync =
	async (): Promise<Transaction> => {
		const wallet = await getOnChainWalletAsync();
		return wallet.transaction;
	};

/**
 * @deprecated Use getOnChainWalletAsync instead.
 */
export const getOnChainWalletElectrum = (): Electrum => {
	return getOnChainWallet().electrum;
};

export const getOnChainWalletElectrumAsync = async (): Promise<Electrum> => {
	const wallet = await getOnChainWalletAsync();
	return wallet.electrum;
};

export const getOnChainWalletDataAsync = async (): Promise<IWalletData> => {
	const wallet = await getOnChainWalletAsync();
	return wallet.data;
};

export const switchNetwork = async (
	selectedNetwork: EAvailableNetwork,
	servers?: TServer | TServer[],
): Promise<Result<boolean>> => {
	const originalNetwork = getSelectedNetwork();
	if (!servers) {
		servers = getCustomElectrumPeers({ selectedNetwork });
	}
	await promiseTimeout(2000, ldk.stop());
	// Wipe existing activity
	dispatch(resetActivityState());
	// Switch to new network.
	dispatch(updateWallet({ selectedNetwork }));
	const wallet = await getOnChainWalletAsync();
	const response = await wallet.switchNetwork(
		EAvailableNetworks[selectedNetwork],
		servers,
	);
	if (response.isErr()) {
		dispatch(updateWallet({ selectedNetwork: originalNetwork }));
		console.error(response.error.message);
		return err(response.error.message);
	}
	globalWallet = response.value;
	setTimeout(updateActivityList, 500);
	return ok(true);
};

/**
 * Returns a fee object for the current/provided transaction.
 * @param {number} [satsPerByte]
 * @param {string} [message]
 * @param {Partial<ISendTransaction>} [transaction]
 * @param {boolean} [fundingLightning]
 * @returns {Result<TGetTotalFeeObj>}
 */
export const getFeeInfo = ({
	satsPerByte,
	transaction,
	message,
	fundingLightning,
}: {
	satsPerByte: number;
	message?: string;
	transaction?: Partial<ISendTransaction>;
	fundingLightning?: boolean;
}): Result<TGetTotalFeeObj> => {
	const wallet = getOnChainWallet();
	return wallet.getFeeInfo({
		satsPerByte,
		transaction,
		message,
		fundingLightning,
	});
};
