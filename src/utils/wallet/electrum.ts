import { Result, err, ok } from '@synonymdev/result';

import {
	EAvailableNetworks,
	EProtocol,
	IAddress,
	IAddresses,
	IHeader,
	ITxHash,
	IUtxo,
	TServer,
} from 'beignet';
import { __E2E__ } from '../../constants/env';
import { EAvailableNetwork } from '../networks';
import {
	ITransaction,
	getCustomElectrumPeers,
	getOnChainWalletAsync,
	getOnChainWalletElectrum,
	getOnChainWalletElectrumAsync,
	getSelectedNetwork,
	refreshWallet,
} from './index';

export interface IGetUtxosResponse {
	utxos: IUtxo[];
	balance: number;
}

export type TUnspentAddressScriptHashData = {
	[x: string]: IUtxo | IAddress;
};

/**
 * Check if app is connected to Electrum Server.
 * @returns {Promise<boolean>}
 */
export const isConnectedElectrum = async (): Promise<boolean> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return electrum.isConnected();
};

/**
 * Formats a provided array of addresses a returns their UTXO's & balances.
 * @param {IAddress[]} allAddresses
 * @returns {Promise<Result<IGetUtxosResponse>>}
 */
export const getAddressUtxos = async ({
	allAddresses,
}: {
	allAddresses: IAddress[];
}): Promise<Result<IGetUtxosResponse>> => {
	const addresses: IAddresses = {};
	allAddresses.map((a) => {
		addresses[a.scriptHash] = a;
	});
	return listUnspentAddressScriptHashes({ addresses });
};

/**
 * Queries Electrum to return the available UTXO's and balance of the provided addresses.
 * @param {TUnspentAddressScriptHashData} addresses
 */
export const listUnspentAddressScriptHashes = async ({
	addresses,
}: {
	addresses: TUnspentAddressScriptHashData;
}): Promise<Result<IGetUtxosResponse>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	const unspentAddressResult = await electrum.listUnspentAddressScriptHashes({
		addresses,
	});
	if (unspentAddressResult.isErr()) {
		throw unspentAddressResult.error.message;
	}
	const { balance, utxos } = unspentAddressResult.value;
	return ok({ utxos, balance });
};

/**
 * Subscribes to a number of address script hashes for receiving.
 * @param {string[]} [scriptHashes]
 * @param {Function} [onReceive]
 * @return {Promise<Result<string>>}
 */
export const subscribeToAddresses = async ({
	scriptHashes = [],
	onReceive,
}: {
	scriptHashes?: string[];
	onReceive?: () => void;
} = {}): Promise<Result<string>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return electrum.subscribeToAddresses({ scriptHashes, onReceive });
};

interface IGetTransactions {
	error: boolean;
	id: number;
	method: string;
	network: string;
	data: ITransaction<IUtxo>[];
}

/**
 * Determines whether a transaction exists based on the transaction response from electrum.
 * @param {ITransaction<IUtxo>} txData
 * @returns {boolean}
 */
export const transactionExists = (txData: ITransaction<IUtxo>): boolean => {
	if (
		// TODO: Update types for electrum response.
		// @ts-ignore
		txData.error?.message &&
		/No such mempool or blockchain transaction|Invalid tx hash/.test(
			// @ts-ignore
			txData.error.message,
		)
	) {
		//Transaction was removed/bumped from the mempool or potentially reorg'd out.
		return false;
	}
	return true;
};

/**
 * Returns available transactions from electrum based on the provided txHashes.
 * @param {ITxHash[]} txHashes
 * @return {Promise<Result<IGetTransactions>>}
 */
export const getTransactions = async ({
	txHashes = [],
}: {
	txHashes: ITxHash[];
}): Promise<Result<IGetTransactions>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return await electrum.getTransactions({ txHashes });
};

export interface IPeerData {
	host: string;
	port: string;
	protocol: EProtocol;
}

/**
 * Returns the currently connected Electrum peer.
 * @return {Promise<Result<IPeerData>>}
 */
export const getConnectedPeer = async (): Promise<Result<IPeerData>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	const peerData = await electrum.getConnectedPeer();
	return peerData as Result<IPeerData>;
};

interface IGetTransactionsFromInputs {
	error: boolean;
	id: number;
	method: string;
	network: string;
	data: ITransaction<{
		tx_hash: string;
		vout: number;
	}>[];
}

/**
 * Returns transactions associated with the provided transaction hashes.
 * @param {ITxHash[]} txHashes
 * @return {Promise<Result<IGetTransactionsFromInputs>>}
 */
export const getTransactionsFromInputs = async ({
	txHashes = [],
}: {
	txHashes: ITxHash[];
}): Promise<Result<IGetTransactionsFromInputs>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return await electrum.getTransactionsFromInputs({ txHashes });
};

export interface TTxResult {
	tx_hash: string;
	height: number;
}

export interface IGetAddressHistoryResponse extends TTxResult, IAddress {}

/**
 * Returns the available history for the provided address script hashes.
 * @param {IAddress[]} [scriptHashes]
 * @param {boolean} [scanAllAddresses]
 * @returns {Promise<Result<IGetAddressHistoryResponse[]>>}
 */
export const getAddressHistory = async ({
	scriptHashes = [],
	scanAllAddresses = false,
}: {
	scriptHashes?: IAddress[];
	scanAllAddresses?: boolean;
}): Promise<Result<IGetAddressHistoryResponse[]>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return await electrum.getAddressHistory({ scriptHashes, scanAllAddresses });
};

/**
 * Connects to the provided electrum peer. Otherwise, it will attempt to connect to a set of default peers.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {ICustomElectrumPeer[]} [customPeers]
 * @param {{ net: undefined, tls: undefined }} [options]
 * @return {Promise<Result<string>>}
 */
export const connectToElectrum = async ({
	customPeers,
	selectedNetwork = getSelectedNetwork(),
}: {
	customPeers?: TServer[];
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string>> => {
	const electrum = await getOnChainWalletElectrumAsync();

	// Attempt to disconnect from any old/lingering connections
	await electrum?.disconnect();

	// Fetch any stored custom peers.
	if (!customPeers) {
		customPeers = getCustomElectrumPeers({ selectedNetwork });
	}

	const connectRes = await electrum.connectToElectrum({
		network: EAvailableNetworks[selectedNetwork],
		servers: customPeers,
		disableRegtestCheck: !__E2E__,
	});

	if (connectRes.isErr()) {
		const msg = connectRes.error.message || 'An unknown error occurred.';
		return err(msg);
	}

	// Check for any new transactions that we might have missed while disconnected.
	refreshWallet().then();

	return ok(connectRes.value);
};

/**
 * Returns combined balance of provided addresses.
 * @param {string[]} addresses
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getAddressBalance = async ({
	addresses = [],
}: {
	addresses: string[];
}): Promise<Result<number>> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.getAddressesBalance(addresses);
};

/**
 * Returns the block hex of the provided block height.
 * @param {number} [height]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const getBlockHex = async ({
	height = 0,
}: {
	height?: number;
}): Promise<Result<string>> => {
	const electrum = await getOnChainWalletElectrumAsync();
	return await electrum.getBlockHex({ height });
};

/**
 * Returns last known block height, and it's corresponding hex from local storage.
 * @returns {IHeader}
 */
export const getBlockHeader = (): IHeader => {
	const electrum = getOnChainWalletElectrum();
	return electrum.getBlockHeader();
};

export const getTransactionMerkle = async ({
	tx_hash,
	height,
}: {
	tx_hash: string;
	height: number;
}): Promise<any> => {
	const electrum = getOnChainWalletElectrum();
	return electrum.getTransactionMerkle({
		tx_hash,
		height,
	});
};
