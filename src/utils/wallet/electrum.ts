import * as electrum from 'rn-electrum-client/helpers';
import * as peers from 'rn-electrum-client/helpers/peers.json';
import * as tls from '../electrum/tls';

import { TAvailableNetworks } from '../networks';
import { err, ok, Result } from '@synonymdev/result';
import {
	IAddress,
	IAddressContent,
	IUtxo,
	IWalletItem,
} from '../../store/types/wallet';
import {
	getAddressFromScriptPubKey,
	getAddressTypes,
	getCurrentWallet,
	getCustomElectrumPeers,
	getScriptHash,
	getSelectedNetwork,
	getSelectedWallet,
	ITransaction,
	ITxHash,
	refreshWallet,
} from './index';
import { Block } from 'bitcoinjs-lib';
import { ICustomElectrumPeer } from '../../store/types/settings';
import { updateHeader } from '../../store/actions/wallet';
import { getStore } from '../../store/helpers';
import {
	IHeader,
	IGetHeaderResponse,
	TGetAddressHistory,
} from '../types/electrum';
import { GAP_LIMIT, CHUNK_LIMIT } from './constants';

export interface IGetUtxosResponse {
	utxos: IUtxo[];
	balance: number;
}

/**
 * Returns utxos for a given wallet and network along with the available balance.
 * @param selectedWallet
 * @param selectedNetwork
 */
export const getUtxos = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<IGetUtxosResponse>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const { currentWallet } = getCurrentWallet({
			selectedNetwork,
			selectedWallet,
		});

		const addressTypes = getAddressTypes();
		let utxos: IUtxo[] = [];
		let balance = 0;
		await Promise.all(
			Object.keys(addressTypes).map(async (addressTypeKey) => {
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}
				if (!selectedWallet) {
					selectedWallet = getSelectedWallet();
				}
				// Check if addresses of this type have been generated. If not, skip.
				if (
					Object.keys(currentWallet.addresses[selectedNetwork][addressTypeKey])
						?.length <= 0
				) {
					return;
				}
				const unspentAddressResult =
					await electrum.listUnspentAddressScriptHashes({
						scriptHashes: {
							key: 'scriptHash',
							data: {
								...currentWallet.addresses[selectedNetwork][addressTypeKey],
								...currentWallet.changeAddresses[selectedNetwork][
									addressTypeKey
								],
							},
						},
						network: selectedNetwork,
					});
				if (unspentAddressResult.error) {
					throw unspentAddressResult.data;
				}
				await Promise.all(
					unspentAddressResult.data.map(({ data, result }) => {
						if (result && result?.length > 0) {
							return result.map((unspentAddress: IUtxo) => {
								balance = balance + unspentAddress.value;
								utxos.push({
									...data,
									...unspentAddress,
								});
							});
						}
					}),
				);
			}),
		);
		return ok({ utxos, balance });
	} catch (e) {
		return err(e);
	}
};

export interface ISubscribeToAddress {
	data: {
		id: number;
		jsonrpc: string;
		result: null;
	};
	error: boolean;
	id: number;
	method: string;
}

/**
 * Subscribes to the next available addressScriptHash.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 * @param scriptHashes
 * @param onReceive
 * @return {Promise<Result<string>>}
 */
export const subscribeToAddresses = async ({
	selectedNetwork,
	selectedWallet,
	scriptHashes = [],
	onReceive = (): null => null,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
	scriptHashes?: string[];
	onReceive?: Function;
}): Promise<Result<string>> => {
	const addressTypes = getAddressTypes();
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const { currentWallet } = getCurrentWallet({
		selectedNetwork,
		selectedWallet,
	});
	// Gather the receiving address scripthash for each address type if no scripthashes were provided.
	if (!scriptHashes?.length) {
		for (const addressType of Object.keys(addressTypes)) {
			// Check if addresses of this type have been generated. If not, skip.
			const addressCount = Object.keys(
				currentWallet.addresses[selectedNetwork][addressType],
			)?.length;
			if (addressCount > 0) {
				const currentIndex =
					currentWallet.addressIndex[selectedNetwork][addressType]?.index ?? 0;
				let lookAheadGapLimit =
					addressCount - currentIndex > GAP_LIMIT
						? GAP_LIMIT
						: addressCount - currentIndex;
				let lookBehindGapLimit =
					currentIndex > GAP_LIMIT ? GAP_LIMIT : currentIndex;

				const lookAheadCount = currentIndex + lookAheadGapLimit;
				const lookBehindCount = currentIndex - lookBehindGapLimit;

				const addresses: IAddress =
					currentWallet.addresses[selectedNetwork][addressType];
				const addressesToSubscribeTo = Object.values(addresses).filter(
					(a) => a.index >= lookBehindCount && a.index <= lookAheadCount,
				);
				let i = 0;
				for (const { scriptHash } of addressesToSubscribeTo) {
					// Only subscribe up to the gap limit.
					if (i > GAP_LIMIT) {
						break;
					}
					scriptHashes.push(scriptHash);
					i++;
				}
			}
		}
	}

	// Subscribe to all provided scriphashes.
	await Promise.all(
		scriptHashes?.map(async (addressScriptHash) => {
			const subscribeAddressResponse: ISubscribeToAddress =
				await electrum.subscribeAddress({
					scriptHash: addressScriptHash,
					network: selectedNetwork,
					onReceive: (): void => {
						refreshWallet({});
						onReceive();
					},
				});
			if (subscribeAddressResponse.error) {
				return err('Unable to subscribe to receiving addresses.');
			}
		}),
	);
	return ok('Successfully subscribed to addresses.');
};

interface ISubscribeToHeader {
	data: {
		height: number;
		hex: string;
	};
	error: boolean;
	id: string;
	method: string;
}

/**
 * Subscribes to the current networks headers.
 * @param {string} [selectedNetwork]
 * @param {Function} [onReceive]
 * @return {Promise<Result<string>>}
 */
export const subscribeToHeader = async ({
	selectedNetwork,
	onReceive = (): void => {},
}: {
	selectedNetwork?: TAvailableNetworks;
	onReceive?: Function;
}): Promise<Result<IHeader>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const subscribeResponse: ISubscribeToHeader = await electrum.subscribeHeader({
		network: selectedNetwork,
		onReceive: async (data) => {
			const hex = data[0].hex;
			const hash = getBlockHashFromHex({ blockHex: hex, selectedNetwork });
			updateHeader({
				selectedNetwork,
				header: { ...data[0], hash },
			});
			onReceive();
		},
	});
	if (subscribeResponse.error) {
		return err('Unable to subscribe to headers.');
	}
	// @ts-ignore
	if (subscribeResponse?.data === 'Already Subscribed.') {
		return ok(getStore().wallet.header[selectedNetwork]);
	}
	// Update local storage with current height and hex.
	const hex = subscribeResponse.data.hex;
	const hash = getBlockHashFromHex({ blockHex: hex, selectedNetwork });
	const header = { ...subscribeResponse.data, hash };
	updateHeader({
		selectedNetwork,
		header,
	});
	return ok(header);
};

interface IGetTransactions {
	error: boolean;
	id: number;
	method: string;
	network: string;
	data: ITransaction<IUtxo>[];
}
/**
 * Returns available transaction from electrum based on the provided txHashes.
 * @param {ITxHash[]} txHashes
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<IGetTransactions>>}
 */
export const getTransactions = async ({
	txHashes = [],
	selectedNetwork,
}: {
	txHashes: ITxHash[];
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<IGetTransactions>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (txHashes.length < 1) {
			return ok({
				error: false,
				id: 0,
				method: 'getTransactions',
				network: selectedNetwork,
				data: [],
			});
		}

		const result: ITransaction<IUtxo>[] = [];

		// split payload in chunks of 10 transactions per-request
		for (let i = 0; i < txHashes.length; i += CHUNK_LIMIT) {
			const chunk = txHashes.slice(i, i + CHUNK_LIMIT);

			const data = {
				key: 'tx_hash',
				data: chunk,
			};
			const response = await electrum.getTransactions({
				txHashes: data,
				network: selectedNetwork,
			});
			if (response.error) {
				return err(response);
			}
			result.push(...response.data);
		}
		return ok({
			error: false,
			id: 0,
			method: 'getTransactions',
			network: selectedNetwork,
			data: result,
		});
	} catch (e) {
		return err(e);
	}
};

export interface IPeerData {
	host: string;
	port: string | number;
	protocol: 'tcp' | 'ssl' | string;
}

/**
 * Returns the currently connected Electrum peer.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<IPeerData>>}
 */
export const getConnectedPeer = async (
	selectedNetwork,
): Promise<Result<IPeerData>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const response = await electrum.getConnectedPeer(selectedNetwork);
		if (response && response?.host && response?.port && response?.protocol) {
			return ok(response);
		}
		return err('No peer available.');
	} catch (e) {
		return err(e);
	}
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<IGetTransactionsFromInputs>>}
 */
export const getTransactionsFromInputs = async ({
	txHashes = [],
	selectedNetwork,
}: {
	txHashes: ITxHash[];
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<IGetTransactionsFromInputs>> => {
	try {
		const data = {
			key: 'tx_hash',
			data: txHashes,
		};
		const response = await electrum.getTransactions({
			txHashes: data,
			network: selectedNetwork,
		});
		if (!response.error) {
			return ok(response);
		} else {
			return err(response);
		}
	} catch (e) {
		return err(e);
	}
};

export interface TTxResult {
	tx_hash: string;
	height: number;
}

interface TTxResponse {
	data: IAddressContent;
	id: number;
	jsonrpc: string;
	param: string;
	result: TTxResult[];
}

interface IGetAddressScriptHashesHistoryResponse {
	data: TTxResponse[];
	error: boolean;
	id: number;
	method: string;
	network: string;
}

export interface IGetAddressHistoryResponse
	extends TTxResult,
		IAddressContent {}

/**
 * Returns the available history for the provided address script hashes.
 * @param {IAddressContent[]} [scriptHashes]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 */
export const getAddressHistory = async ({
	scriptHashes = [],
	selectedNetwork,
	selectedWallet,
}: {
	scriptHashes?: IAddressContent[];
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
}): Promise<Result<IGetAddressHistoryResponse[]>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const { currentWallet } = getCurrentWallet({
			selectedNetwork,
			selectedWallet,
		});
		const currentAddresses = currentWallet.addresses[selectedNetwork];
		const currentChangeAddresses =
			currentWallet.changeAddresses[selectedNetwork];

		if (scriptHashes.length < 1) {
			const addressTypes = getAddressTypes();
			Object.keys(addressTypes).forEach((addressType) => {
				const addresses = currentAddresses[addressType];
				const changeAddresses = currentChangeAddresses[addressType];
				const addressValues: IAddressContent[] = Object.values(addresses);
				const changeAddressValues: IAddressContent[] =
					Object.values(changeAddresses);
				scriptHashes = [
					...scriptHashes,
					...addressValues,
					...changeAddressValues,
				];
			});
		}
		// remove items with same path
		scriptHashes = scriptHashes.filter((sh, index, arr) => {
			return index === arr.findIndex((v) => sh.path === v.path);
		});
		if (scriptHashes.length < 1) {
			return err('No scriptHashes available to check.');
		}

		let combinedResponse: TTxResponse[] = [];

		// split payload in chunks of 10 addresses per-request
		for (let i = 0; i < scriptHashes.length; i += CHUNK_LIMIT) {
			const chunk = scriptHashes.slice(i, i + CHUNK_LIMIT);
			const payload = {
				key: 'scriptHash',
				data: chunk,
			};

			const response: IGetAddressScriptHashesHistoryResponse =
				await electrum.getAddressScriptHashesHistory({
					scriptHashes: payload,
					network: selectedNetwork,
				});

			const mempoolResponse: IGetAddressScriptHashesHistoryResponse =
				await electrum.getAddressScriptHashesMempool({
					scriptHashes: payload,
					network: selectedNetwork,
				});

			if (response.error || mempoolResponse.error) {
				return err('Unable to get address history.');
			}
			combinedResponse.push(...response.data, ...mempoolResponse.data);
		}

		const history: IGetAddressHistoryResponse[] = [];
		combinedResponse.map(
			({
				data,
				result,
			}: {
				data: IAddressContent;
				result: TTxResult[];
			}): void => {
				if (result && result?.length > 0) {
					result.map((item) => {
						history.push({ ...data, ...item });
					});
				}
			},
		);

		return ok(history);
	} catch (e) {
		return err(e);
	}
};

/**
 * Used to retrieve scriptPubkey history for LDK.
 * @param {string} scriptPubkey
 * @returns {Promise<TGetAddressHistory[]>}
 */
export const getScriptPubKeyHistory = async (
	scriptPubkey: string,
): Promise<TGetAddressHistory[]> => {
	const selectedNetwork = getSelectedNetwork();
	let history: { txid: string; height: number }[] = [];
	const address = getAddressFromScriptPubKey(scriptPubkey);
	if (!address) {
		return history;
	}
	const scriptHash = await getScriptHash(address, selectedNetwork);
	if (!scriptHash) {
		return history;
	}
	const response = await electrum.getAddressScriptHashesHistory({
		scriptHashes: [scriptHash],
		network: selectedNetwork,
	});
	if (response.error) {
		return history;
	}
	await Promise.all(
		response.data.map(({ result }): void => {
			if (result && result?.length > 0) {
				result.map((item) => {
					history.push({
						txid: item?.tx_hash ?? '',
						height: item?.height ?? 0,
					});
				});
			}
		}),
	);
	return history;
};

const tempElectrumServers: IWalletItem<ICustomElectrumPeer[]> = {
	bitcoin: peers.bitcoin,
	bitcoinTestnet: peers.bitcoinTestnet,
	bitcoinRegtest: [],
};

/**
 * Connects to the provided electrum peer. Otherwise, it will attempt to connect to a set of default peers.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {number} [retryAttempts]
 * @param {ICustomElectrumPeer[]} [customPeers]
 * @param {{ net: undefined, tls: undefined }} [options]
 * @return {Promise<Result<string>>}
 */
export const connectToElectrum = async ({
	selectedNetwork,
	retryAttempts = 2,
	customPeers,
	options = { net: undefined, tls: undefined },
}: {
	selectedNetwork?: TAvailableNetworks;
	retryAttempts?: number;
	customPeers?: ICustomElectrumPeer[];
	options?: { net?: any; tls?: any };
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	// @ts-ignore
	const net = options.net ?? global?.net;
	const _tls = options.tls ?? tls;

	//Attempt to disconnect from any old/lingering connections
	await electrum.stop({ network: selectedNetwork });

	// Fetch any stored custom peers.
	if (!customPeers) {
		customPeers = getCustomElectrumPeers({ selectedNetwork });
	}
	if (customPeers.length < 1) {
		customPeers = tempElectrumServers[selectedNetwork];
	}
	let startResponse = { error: true, data: '' };
	for (let i = 0; i < retryAttempts; i++) {
		startResponse = await electrum.start({
			network: selectedNetwork,
			customPeers,
			net,
			tls: _tls,
		});
		if (!startResponse.error) {
			break;
		}
	}

	if (startResponse.error) {
		//Attempt one more time
		const { error, data } = await electrum.start({
			network: selectedNetwork,
			customPeers,
			net,
			tls: _tls,
		});
		if (error) {
			return err(data);
		}
		return ok(data);
	}
	return ok(startResponse.data);
};

/**
 * Returns combined balance of provided addresses.
 * @param {string[]} addresses
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getAddressBalance = async ({
	addresses = [],
	selectedNetwork,
}: {
	addresses: string[];
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<number>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const scriptHashes = await Promise.all(
			addresses.map(async (address) => {
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}
				return await getScriptHash(address, selectedNetwork);
			}),
		);
		const res = await electrum.getAddressScriptHashBalances({
			scriptHashes,
			network: selectedNetwork,
		});
		if (res.error) {
			return err(res.data);
		}
		return ok(
			res.data.reduce((acc, cur) => {
				return (
					acc +
					Number(cur.result?.confirmed ?? 0) +
					Number(cur.result?.unconfirmed ?? 0)
				);
			}, 0) || 0,
		);
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the block hex of the provided block height.
 * @param {number} [height]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const getBlockHex = async ({
	height = 0,
	selectedNetwork,
}: {
	height?: number;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const response: IGetHeaderResponse = await electrum.getHeader({
		height,
		network: selectedNetwork,
	});
	if (response.error) {
		return err(response.data);
	}
	return ok(response.data);
};

/**
 * Returns the block hash given a block hex.
 * Leaving blockHex empty will return the last known block hash from storage.
 * @param {string} [blockHex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {string}
 */
export const getBlockHashFromHex = ({
	blockHex,
	selectedNetwork,
}: {
	blockHex?: string;
	selectedNetwork?: TAvailableNetworks;
}): string => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	// If empty, return the last known block hex from storage.
	if (!blockHex) {
		const { hex } = getBlockHeader({ selectedNetwork });
		blockHex = hex;
	}
	const block = Block.fromHex(blockHex);
	const hash = block.getId();
	return hash;
};

/**
 * Returns last known block height, and it's corresponding hex from local storage.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {IHeader}
 */
export const getBlockHeader = ({
	selectedNetwork,
}: {
	selectedNetwork?: TAvailableNetworks;
}): IHeader => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return getStore().wallet.header[selectedNetwork];
};

/**
 * Returns the block hash for the provided height and network.
 * @param {number} [height]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const getBlockHashFromHeight = async ({
	height = 0,
	selectedNetwork,
}: {
	height?: number;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const response = await getBlockHex({ height, selectedNetwork });
	if (response.isErr()) {
		return err(response.error.message);
	}
	const blockHash = getBlockHashFromHex({ blockHex: response.value });
	return ok(blockHash);
};
