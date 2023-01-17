import * as electrum from 'rn-electrum-client/helpers';
import * as peers from 'rn-electrum-client/helpers/peers.json';
import { Block } from 'bitcoinjs-lib';
import { err, ok, Result } from '@synonymdev/result';

import { TAvailableNetworks } from '../networks';
import {
	IAddresses,
	IAddress,
	IUtxo,
	IWalletItem,
	TWalletName,
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
import { ICustomElectrumPeer } from '../../store/types/settings';
import { updateHeader } from '../../store/actions/wallet';
import { getWalletStore } from '../../store/helpers';
import {
	IHeader,
	IGetHeaderResponse,
	TGetAddressHistory,
} from '../types/electrum';
import { GAP_LIMIT, CHUNK_LIMIT } from './constants';
import { objectKeys } from '../objectKeys';

export interface IGetUtxosResponse {
	utxos: IUtxo[];
	balance: number;
}

export type TUnspentAddressScriptHashData = {
	[x: string]: IUtxo | IAddress;
};

/**
 * Returns UTXO's for a given wallet and network along with the available balance.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {boolean} [scanAllAddresses]
 * @returns {Promise<Result<IGetUtxosResponse>>}
 */
export const getUtxos = async ({
	selectedWallet,
	selectedNetwork,
	scanAllAddresses = false,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	scanAllAddresses?: boolean;
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

		const addressTypes = objectKeys(getAddressTypes());
		let addresses = {} as IAddresses;
		let changeAddresses = {} as IAddresses;
		let existingUtxos: { [key: string]: IUtxo } = {};

		await Promise.all(
			addressTypes.map(async (addressType) => {
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}
				if (!selectedWallet) {
					selectedWallet = getSelectedWallet();
				}
				const addressCount = Object.keys(
					currentWallet.addresses[selectedNetwork][addressType],
				)?.length;
				// Check if addresses of this type have been generated. If not, skip.
				if (addressCount <= 0) {
					return;
				}

				// Grab the current index for both addresses and change addresses.
				const addressIndex =
					currentWallet.addressIndex[selectedNetwork][addressType].index;
				const changeAddressIndex =
					currentWallet.changeAddressIndex[selectedNetwork][addressType].index;

				// Grab all addresses and change addresses.
				const allAddresses =
					currentWallet.addresses[selectedNetwork][addressType];
				const allChangeAddresses =
					currentWallet.changeAddresses[selectedNetwork][addressType];

				// Instead of scanning all addresses, adhere to the gap limit.
				if (!scanAllAddresses && addressIndex >= 0 && changeAddressIndex >= 0) {
					Object.values(allAddresses).map((a) => {
						if (Math.abs(a.index - addressIndex) <= GAP_LIMIT) {
							addresses[a.scriptHash] = a;
						}
					});
					Object.values(allChangeAddresses).map((a) => {
						if (Math.abs(a.index - changeAddressIndex) <= GAP_LIMIT) {
							changeAddresses[a.scriptHash] = a;
						}
					});
				} else {
					addresses = { ...addresses, ...allAddresses };
					changeAddresses = { ...changeAddresses, ...allChangeAddresses };
				}
			}),
		);

		// Make sure we're re-check existing utxos that may exist outside the gap limit and putting them in the necessary format.
		currentWallet.utxos[selectedNetwork].map((utxo) => {
			existingUtxos[utxo.scriptHash] = utxo;
		});

		const data: TUnspentAddressScriptHashData = {
			...addresses,
			...changeAddresses,
			...existingUtxos,
		};

		return listUnspentAddressScriptHashes({ addresses: data, selectedNetwork });
	} catch (e) {
		return err(e);
	}
};

/**
 * Formats a provided array of addresses a returns their UTXO's & balances.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IAddress[]} allAddresses
 * @returns {Promise<Result<IGetUtxosResponse>>}
 */
export const getAddressUtxos = async ({
	selectedNetwork,
	allAddresses,
}: {
	selectedNetwork?: TAvailableNetworks;
	allAddresses: IAddress[];
}): Promise<Result<IGetUtxosResponse>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	let addresses: IAddresses = {};
	allAddresses.map((a) => {
		addresses[a.scriptHash] = a;
	});
	return listUnspentAddressScriptHashes({ selectedNetwork, addresses });
};

/**
 * Queries Electrum to return the available UTXO's and balance of the provided addresses.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TUnspentAddressScriptHashData} addresses
 */
export const listUnspentAddressScriptHashes = async ({
	selectedNetwork,
	addresses,
}: {
	selectedNetwork?: TAvailableNetworks;
	addresses: TUnspentAddressScriptHashData;
}): Promise<Result<IGetUtxosResponse>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const unspentAddressResult = await electrum.listUnspentAddressScriptHashes({
		scriptHashes: {
			key: 'scriptHash',
			data: addresses,
		},
		network: selectedNetwork,
	});
	if (unspentAddressResult.error) {
		throw unspentAddressResult.data;
	}
	let balance = 0;
	let utxos: IUtxo[] = [];
	unspentAddressResult.data.map(({ data, result }) => {
		if (result?.length > 0) {
			return result.map((unspentAddress: IUtxo) => {
				balance = balance + unspentAddress.value;
				utxos.push({
					...data,
					...unspentAddress,
				});
			});
		}
	});
	return ok({ utxos, balance });
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
 * @param {TWalletName} [selectedWallet]
 * @param scriptHashes
 * @param onReceive
 * @return {Promise<Result<string>>}
 */
export const subscribeToAddresses = async ({
	selectedNetwork,
	selectedWallet,
	scriptHashes = [],
	onReceive,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	scriptHashes?: string[];
	onReceive?: () => void;
}): Promise<Result<string>> => {
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
	const addressTypes = objectKeys(getAddressTypes());

	// Gather the receiving address scripthash for each address type if no scripthashes were provided.
	if (!scriptHashes.length) {
		for (const addressType of addressTypes) {
			// Check if addresses of this type have been generated. If not, skip.
			const addressCount = Object.keys(
				currentWallet.addresses[selectedNetwork][addressType],
			)?.length;
			if (addressCount > 0) {
				const addresses = currentWallet.addresses[selectedNetwork][addressType];
				let addressIndex =
					currentWallet.addressIndex[selectedNetwork][addressType]?.index;
				addressIndex = addressIndex > 0 ? addressIndex : 0;
				const addressesToSubscribeTo = Object.values(addresses).filter(
					(a) => Math.abs(a.index - addressIndex) <= GAP_LIMIT,
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
		scriptHashes.map(async (addressScriptHash) => {
			const subscribeAddressResponse: ISubscribeToAddress =
				await electrum.subscribeAddress({
					scriptHash: addressScriptHash,
					network: selectedNetwork,
					onReceive: (): void => {
						refreshWallet({});
						onReceive?.();
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
	onReceive,
}: {
	selectedNetwork?: TAvailableNetworks;
	onReceive?: () => void;
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
			onReceive?.();
		},
	});
	if (subscribeResponse.error) {
		return err('Unable to subscribe to headers.');
	}
	// @ts-ignore
	if (subscribeResponse?.data === 'Already Subscribed.') {
		return ok(getBlockHeader({ selectedNetwork }));
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
 * Returns available transactions from electrum based on the provided txHashes.
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
	port: string;
	protocol: 'tcp' | 'ssl';
}

/**
 * Returns the currently connected Electrum peer.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<IPeerData>>}
 */
export const getConnectedPeer = async (
	selectedNetwork: TAvailableNetworks,
): Promise<Result<IPeerData>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const response = await electrum.getConnectedPeer(selectedNetwork);
		if (response?.host && response?.port && response?.protocol) {
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
	data: IAddress;
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

export interface IGetAddressHistoryResponse extends TTxResult, IAddress {}

/**
 * Returns the available history for the provided address script hashes.
 * @param {IAddress[]} [scriptHashes]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @param {boolean} [scanAllAddresses]
 * @returns {Promise<Result<IGetAddressHistoryResponse[]>>}
 */
export const getAddressHistory = async ({
	scriptHashes = [],
	selectedNetwork,
	selectedWallet,
	scanAllAddresses = false,
}: {
	scriptHashes?: IAddress[];
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	scanAllAddresses?: boolean;
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

		const addressIndexes = currentWallet.addressIndex[selectedNetwork];
		const changeAddressIndexes =
			currentWallet.changeAddressIndex[selectedNetwork];

		if (scriptHashes.length < 1) {
			const addressTypes = objectKeys(getAddressTypes());
			addressTypes.forEach((addressType) => {
				const addresses = currentAddresses[addressType];
				const changeAddresses = currentChangeAddresses[addressType];
				let addressValues = Object.values(addresses);
				let changeAddressValues = Object.values(changeAddresses);

				const addressIndex = addressIndexes[addressType].index;
				const changeAddressIndex = changeAddressIndexes[addressType].index;

				// Instead of scanning all addresses, adhere to the gap limit.
				if (!scanAllAddresses && addressIndex >= 0 && changeAddressIndex >= 0) {
					addressValues = addressValues.filter(
						(a) => Math.abs(addressIndex - a.index) <= GAP_LIMIT,
					);
					changeAddressValues = changeAddressValues.filter(
						(a) => Math.abs(changeAddressIndex - a.index) <= GAP_LIMIT,
					);
				}

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
			({ data, result }: { data: IAddress; result: TTxResult[] }): void => {
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<TGetAddressHistory[]>}
 */
export const getScriptPubKeyHistory = async (
	scriptPubkey: string,
	selectedNetwork?: TAvailableNetworks,
): Promise<TGetAddressHistory[]> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	let history: { txid: string; height: number }[] = [];
	const address = getAddressFromScriptPubKey(scriptPubkey, selectedNetwork);
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

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type TCustomElectrumPeerOptionalProtocol = PartialBy<
	ICustomElectrumPeer,
	'protocol'
>;

const tempElectrumServers: IWalletItem<TCustomElectrumPeerOptionalProtocol[]> =
	{
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
	customPeers?: TCustomElectrumPeerOptionalProtocol[];
	options?: { net?: any; tls?: any };
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const net = options.net ?? global?.net;
	// const _tls = options.tls ?? tls;
	const _tls = options.tls ?? global?.tls;

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
			const msg = data || 'An unknown error occurred.';
			return err(msg);
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
	return getWalletStore().header[selectedNetwork];
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

export const getTransactionMerkle = async ({
	tx_hash,
	height,
	selectedNetwork,
}: {
	tx_hash: string;
	height: number;
	selectedNetwork?: TAvailableNetworks;
}): Promise<any> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return await electrum.getTransactionMerkle({
		tx_hash,
		height,
		network: selectedNetwork,
	});
};
