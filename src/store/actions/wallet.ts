import { err, ok, Result } from '@synonymdev/result';

import actions from './actions';
import {
	EAddressType,
	EBoostType,
	IAddress,
	ICreateWallet,
	IFormattedTransaction,
	IFormattedTransactions,
	IKeyDerivationPath,
	IUtxo,
	IWallets,
	IWalletStore,
	TProcessUnconfirmedTransactions,
	TWalletName,
} from '../types/wallet';
import {
	blockHeightToConfirmations,
	confirmationsToBlockHeight,
	createDefaultWallet,
	generateAddresses,
	getCurrentWallet,
	getKeyDerivationPathObject,
	getNextAvailableAddress,
	getOnChainWallet,
	getOnChainWalletTransaction,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
	getUnconfirmedTransactions,
	ITransaction,
	ITxHash,
	refreshWallet,
	removeDuplicateAddresses,
	rescanAddresses,
} from '../../utils/wallet';
import {
	getDispatch,
	getFeesStore,
	getSettingsStore,
	getStore,
} from '../helpers';
import {
	EAvailableNetworks as EBitkitAvailableNetworks,
	TAvailableNetworks,
} from '../../utils/networks';
import { objectKeys } from '../../utils/objectKeys';
import {
	IGenerateAddresses,
	IGenerateAddressesResponse,
} from '../../utils/types';
import { removeKeyFromObject } from '../../utils/helpers';
import {
	getTransactions,
	getUtxos,
	transactionExists,
} from '../../utils/wallet/electrum';
import { IHeader } from '../../utils/types/electrum';
import { GAP_LIMIT } from '../../utils/wallet/constants';
import { addressTypes, getDefaultWalletShape } from '../shapes/wallet';
import { TGetImpactedAddressesRes } from '../types/checks';
import { updateActivityItem, updateActivityList } from './activity';
import { getActivityItemById } from '../../utils/activity';
import { getFakeTransaction } from '../../utils/wallet/testing';
import { EActivityType, TOnchainActivityItem } from '../types/activity';
import {
	EAvailableNetworks,
	EFeeId,
	getDefaultWalletData,
	getExchangeRates,
	getStorageKeyValues,
	getWalletDataStorageKey,
	IBoostedTransaction,
	IExchangeRates,
	IOnchainFees,
	ISendTransaction,
	IWalletData,
	TSetupTransactionResponse,
} from 'beignet';
import cloneDeep from 'lodash/cloneDeep';
import { ETransactionSpeed } from '../types/settings';
import { updateOnchainFeeEstimates } from './fees';

const dispatch = getDispatch();

export const updateWallet = (
	payload: Partial<IWalletStore>,
): Result<string> => {
	dispatch({
		type: actions.UPDATE_WALLET,
		payload,
	});
	return ok('');
};

/**
 * Creates and stores a newly specified wallet.
 * @param {string} mnemonic
 * @param {string} [wallet]
 * @param {string} [bip39Passphrase]
 * @param {Partial<IAddressTypes>} [addressTypesToCreate]
 * @return {Promise<Result<string>>}
 */
export const createWallet = async ({
	walletName = 'wallet0',
	mnemonic,
	bip39Passphrase = '',
	restore = false,
	addressTypesToCreate,
}: ICreateWallet): Promise<Result<string>> => {
	if (!addressTypesToCreate) {
		addressTypesToCreate = addressTypes;
	}
	try {
		const response = await createDefaultWallet({
			walletName,
			mnemonic,
			bip39Passphrase,
			restore,
			addressTypesToCreate,
		});
		if (response.isErr()) {
			return err(response.error.message);
		}
		dispatch({
			type: actions.CREATE_WALLET,
			payload: response.value,
		});
		return ok('');
	} catch (e) {
		return err(e);
	}
};

export const createDefaultWalletStructure = async ({
	walletName = 'wallet0',
}: {
	walletName?: TWalletName;
}): Promise<Result<string>> => {
	try {
		const payload: IWallets = {
			[walletName]: getDefaultWalletShape(),
		};
		dispatch({
			type: actions.CREATE_WALLET,
			payload,
		});
		return ok('');
	} catch (e) {
		return err(e);
	}
};

export const updateExchangeRates = async (
	exchangeRates: IExchangeRates,
): Promise<Result<string>> => {
	if (!exchangeRates) {
		const res = await getExchangeRates();
		if (res.isErr()) {
			return err(res.error);
		}
		exchangeRates = res.value;
	}

	dispatch({
		type: actions.UPDATE_WALLET,
		payload: { exchangeRates },
	});

	return ok('Successfully updated the exchange rate.');
};

/**
 * This method updates the next available (zero-balance) address & changeAddress index.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @return {string}
 */
export const updateAddressIndexes = async ({
	selectedWallet,
	selectedNetwork,
	addressType, //If this param is left undefined it will update the indexes for all stored address types.
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
} = {}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});

	let addressTypeKeys = Object.keys(EAddressType) as EAddressType[];
	if (addressType) {
		addressTypeKeys = [addressType];
	}

	let updated = false;

	const promises = addressTypeKeys.map(async (addressTypeKey) => {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const response = await getNextAvailableAddress({
			selectedWallet,
			selectedNetwork,
			addressType: addressTypeKey,
		});
		if (response.isErr()) {
			throw response.error;
		}
		const result = response.value;

		let addressIndex =
			currentWallet.addressIndex[selectedNetwork][addressTypeKey];
		let changeAddressIndex =
			currentWallet.changeAddressIndex[selectedNetwork][addressTypeKey];
		let lastUsedAddressIndex =
			currentWallet.lastUsedAddressIndex[selectedNetwork][addressTypeKey];
		let lastUsedChangeAddressIndex =
			currentWallet.lastUsedChangeAddressIndex[selectedNetwork][addressTypeKey];

		if (
			addressIndex.index < 0 ||
			changeAddressIndex.index < 0 ||
			result.addressIndex.index > addressIndex.index ||
			result.changeAddressIndex.index > changeAddressIndex.index ||
			result.lastUsedAddressIndex.index > lastUsedAddressIndex.index ||
			result.lastUsedChangeAddressIndex.index >
				lastUsedChangeAddressIndex?.index
		) {
			if (result.addressIndex) {
				addressIndex = result.addressIndex;
			}

			if (result.changeAddressIndex) {
				changeAddressIndex = result.changeAddressIndex;
			}

			if (result.lastUsedAddressIndex) {
				lastUsedAddressIndex = result.lastUsedAddressIndex;
			}

			if (result.lastUsedChangeAddressIndex) {
				lastUsedChangeAddressIndex = result.lastUsedChangeAddressIndex;
			}

			//Final check to ensure that both addresses and change addresses do not exceed the gap limit/scanning threshold.
			//If either does, we generate a new addresses and/or change address at +1 the last used index.
			if (
				Math.abs(addressIndex.index - lastUsedAddressIndex.index) > GAP_LIMIT
			) {
				const _addressIndex = await generateAddresses({
					selectedWallet,
					selectedNetwork,
					addressType: addressTypeKey,
					addressAmount: 1,
					changeAddressAmount: 0,
					addressIndex: lastUsedAddressIndex.index + 1,
				});
				if (_addressIndex.isErr()) {
					return err(_addressIndex.error.message);
				}
				addressIndex = _addressIndex.value.addresses[0];
			}

			if (
				Math.abs(changeAddressIndex.index - lastUsedChangeAddressIndex.index) >
				GAP_LIMIT
			) {
				const _changeAddressIndex = await generateAddresses({
					selectedWallet,
					selectedNetwork,
					addressType: addressTypeKey,
					addressAmount: 0,
					changeAddressAmount: 1,
					changeAddressIndex: lastUsedChangeAddressIndex.index + 1,
				});
				if (_changeAddressIndex.isErr()) {
					return err(_changeAddressIndex.error.message);
				}
				changeAddressIndex = _changeAddressIndex.value.changeAddresses[0];
			}

			//Ensure that the address indexes are integers.
			if (!Number.isInteger(addressIndex.index)) {
				return err('Invalid address index.');
			}
			if (!Number.isInteger(changeAddressIndex.index)) {
				return err('Invalid change address index.');
			}
			if (!Number.isInteger(lastUsedAddressIndex.index)) {
				return err('Invalid last used address index.');
			}
			if (!Number.isInteger(lastUsedChangeAddressIndex.index)) {
				return err('Invalid last used change address index.');
			}

			dispatch({
				type: actions.UPDATE_ADDRESS_INDEX,
				payload: {
					addressIndex,
					changeAddressIndex,
					lastUsedAddressIndex,
					lastUsedChangeAddressIndex,
					addressType: addressTypeKey,
				},
			});
			updated = true;
		}
	});

	try {
		await Promise.all(promises);
	} catch (e) {
		return err(e);
	}

	return ok(updated ? 'Successfully updated indexes.' : 'No update needed.');
};

/**
 * Resets address indexes back to the app's default/original state.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {void}
 */
export const resetAddressIndexes = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
}): void => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const addressTypeKeys = objectKeys(EAddressType);
	const defaultWalletShape = getDefaultWalletShape();

	addressTypeKeys.forEach((addressType) => {
		dispatch({
			type: actions.UPDATE_ADDRESS_INDEX,
			payload: {
				selectedWallet,
				selectedNetwork,
				addressIndex:
					defaultWalletShape.addressIndex[selectedNetwork][addressType],
				changeAddressIndex:
					defaultWalletShape.changeAddressIndex[selectedNetwork][addressType],
				lastUsedAddressIndex:
					defaultWalletShape.lastUsedAddressIndex[selectedNetwork][addressType],
				lastUsedChangeAddressIndex:
					defaultWalletShape.lastUsedChangeAddressIndex[selectedNetwork][
						addressType
					],
				addressType,
			},
		});
	});
};

export const generateNewReceiveAddress = async ({
	addressType,
	keyDerivationPath,
}: {
	addressType?: EAddressType;
	keyDerivationPath?: IKeyDerivationPath;
}): Promise<Result<IAddress>> => {
	try {
		const wallet = getOnChainWallet();
		return wallet.generateNewReceiveAddress({ addressType, keyDerivationPath });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * This method will generate addresses as specified and return an object of filtered addresses to ensure no duplicates are returned.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @param {number} [addressAmount]
 * @param {number} [changeAddressAmount]
 * @param {number} [addressIndex]
 * @param {number} [changeAddressIndex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IKeyDerivationPath} [keyDerivationPath]
 * @param {EAddressType} [addressType]
 * @return {Promise<Result<IGenerateAddressesResponse>>}
 */
export const addAddresses = async ({
	selectedWallet,
	addressAmount = 5,
	changeAddressAmount = 5,
	addressIndex = 0,
	changeAddressIndex = 0,
	selectedNetwork,
	addressType,
	keyDerivationPath,
}: IGenerateAddresses): Promise<Result<IGenerateAddressesResponse>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!addressType) {
		addressType = getSelectedAddressType({ selectedWallet, selectedNetwork });
	}
	const { path, type } = addressTypes[addressType];
	if (!keyDerivationPath) {
		const keyDerivationPathResponse = getKeyDerivationPathObject({
			selectedNetwork,
			path,
		});
		if (keyDerivationPathResponse.isErr()) {
			return err(keyDerivationPathResponse.error.message);
		}
		keyDerivationPath = keyDerivationPathResponse.value;
	}
	const generatedAddresses = await generateAddresses({
		addressAmount,
		changeAddressAmount,
		addressIndex,
		changeAddressIndex,
		selectedNetwork,
		selectedWallet,
		keyDerivationPath,
		addressType: type,
	});
	if (generatedAddresses.isErr()) {
		return err(generatedAddresses.error);
	}

	const removeDuplicateResponse = await removeDuplicateAddresses({
		addresses: generatedAddresses.value.addresses,
		changeAddresses: generatedAddresses.value.changeAddresses,
		selectedWallet,
		selectedNetwork,
	});
	if (removeDuplicateResponse.isErr()) {
		return err(removeDuplicateResponse.error.message);
	}

	const addresses = removeDuplicateResponse.value.addresses;
	const changeAddresses = removeDuplicateResponse.value.changeAddresses;
	if (!Object.keys(addresses).length && !Object.keys(changeAddresses).length) {
		return err('No addresses to add.');
	}

	const payload = {
		addresses,
		changeAddresses,
		addressType,
	};
	dispatch({
		type: actions.ADD_ADDRESSES,
		payload,
	});
	return ok({ ...generatedAddresses.value, addressType: type });
};

/**
 * This method serves two functions.
 * 1. Update UTXO data for all addresses and change addresses for a given wallet and network.
 * 2. Update the available balance for a given wallet and network.
 */
export const updateUtxos = async ({
	selectedWallet,
	selectedNetwork,
	scanAllAddresses = false,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	scanAllAddresses?: boolean;
}): Promise<Result<{ utxos: IUtxo[]; balance: number }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const utxoResponse = await getUtxos({
		scanAllAddresses,
	});
	if (utxoResponse.isErr()) {
		return err(utxoResponse.error);
	}
	const { utxos, balance } = utxoResponse.value;
	// Ensure we're not adding any duplicates.
	const filteredUtxos = utxos.filter(
		(utxo, index, _utxos) =>
			index ===
			_utxos.findIndex(
				(u) =>
					u.scriptHash === utxo.scriptHash &&
					u.tx_pos === utxo.tx_pos &&
					u.tx_hash === utxo.tx_hash,
			),
	);
	const payload = {
		selectedWallet,
		selectedNetwork,
		utxos: filteredUtxos,
		balance,
	};
	dispatch({
		type: actions.UPDATE_UTXOS,
		payload,
	});
	return ok(payload);
};

/**
 * Clears the UTXO array and balance.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<string>}
 */
export const clearUtxos = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): Promise<string> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		selectedWallet,
		selectedNetwork,
		utxos: [],
		balance: 0,
	};
	dispatch({
		type: actions.UPDATE_UTXOS,
		payload,
	});
	return "Successfully cleared UTXO's.";
};

/**
 * Clears the transactions object for a given wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {string}
 */
export const clearTransactions = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): string => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.RESET_TRANSACTIONS,
		payload,
	});
	return 'Successfully reset transactions.';
};

/**
 * Clears the addresses and changeAddresses object for a given wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {string}
 */
export const clearAddresses = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): string => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.RESET_ADDRESSES,
		payload,
	});
	return 'Successfully reset transactions.';
};

export const updateWalletBalance = ({
	balance,
}: {
	balance: number;
}): Result<string> => {
	try {
		const wallet = getOnChainWallet();
		return wallet.updateWalletBalance({ balance });
	} catch (e) {
		return err(e);
	}
};

export interface ITransactionData {
	address: string;
	height: number;
	index: number;
	path: string;
	scriptHash: string;
	tx_hash: string;
	tx_pos: number;
	value: number;
}

/**
 * This method processes all transactions with less than 6 confirmations and returns the following:
 * 1. Transactions that still have less than 6 confirmations and can be considered unconfirmed. (unconfirmedTxs)
 * 2. Transactions that have fewer confirmations than before due to a reorg. (outdatedTxs)
 * 3. Transactions that have been removed from the mempool. (ghostTxs)
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<TProcessUnconfirmedTransactions>>}
 */
export const processUnconfirmedTransactions = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessUnconfirmedTransactions>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		//Retrieve all unconfirmed transactions (tx less than 6 confirmations in this case) from the store
		const oldUnconfirmedTxsRes = await getUnconfirmedTransactions({
			selectedWallet,
			selectedNetwork,
		});
		if (oldUnconfirmedTxsRes.isErr()) {
			return err(oldUnconfirmedTxsRes.error);
		}
		const oldUnconfirmedTxs = oldUnconfirmedTxsRes.value;

		//Use electrum to check if the transaction was removed/bumped from the mempool or if it still exists.
		const tx_hashes: ITxHash[] = Object.values(oldUnconfirmedTxs).map(
			(transaction: IFormattedTransaction) => {
				return { tx_hash: transaction.txid };
			},
		);
		const txs = await getTransactions({
			txHashes: tx_hashes,
		});
		if (txs.isErr()) {
			return err(txs.error);
		}

		const unconfirmedTxs: IFormattedTransactions = {};
		const outdatedTxs: IUtxo[] = []; //Transactions that have been pushed back into the mempool due to a reorg. We need to update the height.
		const ghostTxs: string[] = []; //Transactions that have been removed from the mempool and are no longer in the blockchain.
		txs.value.data.forEach((txData: ITransaction<IUtxo>) => {
			// Check if the transaction has been removed from the mempool/still exists.
			if (!transactionExists(txData)) {
				//Transaction may have been removed/bumped from the mempool or potentially reorg'd out.
				ghostTxs.push(txData.data.tx_hash);
				return;
			}

			const newHeight = confirmationsToBlockHeight({
				confirmations: txData.result?.confirmations ?? 0,
				selectedNetwork,
			});

			if (!txData.result?.confirmations) {
				const oldHeight = oldUnconfirmedTxs[txData.data.tx_hash]?.height ?? 0;
				if (oldHeight > newHeight) {
					//Transaction was reorg'd back to zero confirmations. Add it to the outdatedTxs array.
					outdatedTxs.push(txData.data);
				}
				unconfirmedTxs[txData.data.tx_hash] = {
					...oldUnconfirmedTxs[txData.data.tx_hash],
					height: newHeight,
				};
				return;
			}

			//Check if the transaction has been confirmed.
			if (txData.result?.confirmations < 6) {
				unconfirmedTxs[txData.data.tx_hash] = {
					...oldUnconfirmedTxs[txData.data.tx_hash],
					height: newHeight,
				};
			}
		});
		return ok({
			unconfirmedTxs,
			outdatedTxs,
			ghostTxs,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Updates the confirmation state of activity item transactions that were reorg'd out.
 * @param {IUtxo[]} txs
 */
export const updateTransactionHeights = async (
	txs: IUtxo[],
): Promise<string> => {
	txs.forEach((tx) => {
		const txId = tx.tx_hash;
		const activity = getActivityItemById(txId);
		if (activity.isOk() && activity.value) {
			//Update the activity item to reflect that the transaction has a new height.
			const item = {
				...activity.value,
				confirmed: false,
			};
			updateActivityItem(txId, item);
		}
	});
	return 'Successfully updated reorg transactions.';
};

/**
 * Removes transactions from the store and activity list.
 * @param {string[]} txIds
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const updateGhostTransactions = async ({
	txIds,
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	txIds: string[];
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		txIds.forEach((txId) => {
			const activity = getActivityItemById(txId);
			if (activity.isOk() && activity.value) {
				if (activity.value.activityType === EActivityType.onchain) {
					//Update the activity item to reflect that the transaction no longer exists, but that it did at one point in time.
					const item: TOnchainActivityItem = {
						...activity.value,
						exists: false,
					};
					updateActivityItem(txId, item);
				}
			}
		});

		//Rescan the addresses to get the correct balance.
		await rescanAddresses({
			shouldClearAddresses: false, // No need to clear addresses since we are only updating the balance.
		});
		return ok('Successfully deleted transactions.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Parses and adds unconfirmed transactions to the store.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IFormattedTransactions} transactions
 * @returns {Result<string>}
 */
export const addUnconfirmedTransactions = ({
	selectedWallet,
	selectedNetwork,
	transactions,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	transactions: IFormattedTransactions;
}): Result<string> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		let unconfirmedTransactions: IFormattedTransactions = {};
		Object.keys(transactions).forEach((key) => {
			const confirmations = blockHeightToConfirmations({
				blockHeight: transactions[key].height,
			});
			if (confirmations < 6) {
				unconfirmedTransactions[key] = transactions[key];
			}
		});

		if (!Object.keys(unconfirmedTransactions).length) {
			return ok('No unconfirmed transactions found.');
		}

		const payload = {
			selectedNetwork,
			selectedWallet,
			unconfirmedTransactions,
		};

		dispatch({
			type: actions.ADD_UNCONFIRMED_TRANSACTIONS,
			payload,
		});
		return ok('Successfully updated unconfirmed transactions.');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * FOR TESTING PURPOSES ONLY. DO NOT USE.
 * Injects a fake transaction into the store for testing.
 * @param {string} [id]
 * @param {IFormattedTransaction} [fakeTx]
 * @param {boolean} [shouldRefreshWallet]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const injectFakeTransaction = ({
	id = 'fake-transaction',
	fakeTx,
	selectedWallet,
	selectedNetwork,
}: {
	id?: string;
	fakeTx?: IFormattedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<string> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const fakeTransaction = fakeTx ?? getFakeTransaction(id);

		const payload = {
			selectedNetwork,
			selectedWallet,
			transactions: fakeTransaction,
		};
		dispatch({
			type: actions.UPDATE_TRANSACTIONS,
			payload,
		});
		addUnconfirmedTransactions({
			selectedNetwork,
			selectedWallet,
			transactions: fakeTransaction,
		});
		updateActivityList();

		return ok('Successfully injected fake transactions.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves, formats & stores the transaction history for the selected wallet/network.
 * @param {boolean} [scanAllAddresses]
 * @param {boolean} [replaceStoredTransactions] Setting this to true will set scanAllAddresses to true as well.
 * @param {boolean} [showNotification]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateTransactions = async ({
	scanAllAddresses = false,
	replaceStoredTransactions = false,
}: {
	scanAllAddresses?: boolean;
	replaceStoredTransactions?: boolean;
}): Promise<Result<string | undefined>> => {
	const wallet = getOnChainWallet();
	return await wallet.updateTransactions({
		scanAllAddresses,
		replaceStoredTransactions,
	});
};

/**
 * Deletes a given on-chain trnsaction by id.
 * @param {string} txid
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const deleteOnChainTransactionById = async ({
	txid,
}: {
	txid: string;
}): Promise<void> => {
	const wallet = getOnChainWallet();
	return await wallet.deleteOnChainTransactionById({
		txid,
	});
};

/**
 * Adds a boosted transaction id to the boostedTransactions object.
 * @param {string} newTxId
 * @param {string} oldTxId
 * @param {EBoostType} [type]
 * @param {number} fee
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addBoostedTransaction = async ({
	newTxId,
	oldTxId,
	type = EBoostType.cpfp,
	fee,
}: {
	newTxId: string;
	oldTxId: string;
	type?: EBoostType;
	fee: number;
}): Promise<Result<IBoostedTransaction>> => {
	const wallet = getOnChainWallet();
	return await wallet.addBoostedTransaction({
		newTxId,
		oldTxId,
		type,
		fee,
	});
};

/**
 * This does not delete the stored mnemonic phrase for a given wallet.
 * This resets a given wallet to defaultWalletShape
 */
export const resetSelectedWallet = async ({
	selectedWallet,
}: {
	selectedWallet?: TWalletName;
}): Promise<void> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	dispatch({
		type: actions.RESET_SELECTED_WALLET,
		payload: { selectedWallet },
	});
	await refreshWallet();
};

/**
 * Sets up a transaction for a given wallet by gathering inputs, setting the next available change address as an output and sets up the baseline fee structure.
 * This function will not override previously set transaction data. To do that you'll need to call resetSendTransaction.
 * @param {TWalletName} [selectedWallet]
 * @param {string[]} [inputTxHashes]
 * @param {IUtxo[]} [utxos]
 * @param {boolean} [rbf]
 * @param satsPerByte
 * @returns {Promise<Result<Partial<ISendTransaction>>>}
 */
export const setupOnChainTransaction = async ({
	//addressType,
	inputTxHashes,
	utxos,
	rbf = false,
	satsPerByte,
}: {
	//addressType?: EAddressType; // Preferred address type for change address.
	inputTxHashes?: string[]; // Used to pre-specify inputs to use by tx_hash
	utxos?: IUtxo[]; // Used to pre-specify utxos to use
	rbf?: boolean; // Enable or disable rbf.
	satsPerByte?: number; // Set the sats per byte for the transaction.
} = {}): Promise<TSetupTransactionResponse> => {
	const transaction = getOnChainWalletTransaction();
	return await transaction.setupTransaction({
		inputTxHashes,
		utxos,
		rbf,
		satsPerByte,
	});
};

/**
 * Retrieves the next available change address data.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @returns {Promise<Result<IAddress>>}
 */
export const getChangeAddress = async ({
	addressType,
}: {
	addressType?: EAddressType;
}): Promise<Result<IAddress>> => {
	const wallet = getOnChainWallet();
	return await wallet.getChangeAddress(addressType);
};

/**
 * This updates the transaction state used for sending.
 * @param {Partial<ISendTransaction>} transaction
 * @returns {Promise<Result<string>>}
 */
export const updateSendTransaction = ({
	transaction,
}: {
	transaction: Partial<ISendTransaction>;
}): Result<string> => {
	const tx = getOnChainWalletTransaction();
	return tx.updateSendTransaction({
		transaction,
	});
};

/**
 * This completely resets the send transaction state for the specified wallet and network.
 * @returns {Result<string>}
 */
export const resetSendTransaction = async (): Promise<Result<string>> => {
	const transaction = getOnChainWalletTransaction();
	return transaction.resetSendTransaction();
};

export const updateSelectedAddressType = async ({
	addressType,
}: {
	addressType: EAddressType;
}): Promise<void> => {
	const wallet = getOnChainWallet();
	return await wallet.updateAddressType(addressType);
};

/**
 * Removes the specified input from the current transaction.
 * @param {IUtxo} input
 * @returns {Result<IUtxo[]>}
 */
export const removeTxInput = ({ input }: { input: IUtxo }): Result<IUtxo[]> => {
	const wallet = getOnChainWallet();
	return wallet.removeTxInput({
		input,
	});
};

/**
 * Adds a specified input to the current transaction.
 * @param {IUtxo} input
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addTxInput = ({ input }: { input: IUtxo }): Result<IUtxo[]> => {
	const wallet = getOnChainWallet();
	return wallet.addTxInput({
		input,
	});
};

/**
 * Adds a specified tag to the current transaction.
 * @param {string} tag
 * @returns {Result<string>}
 */
export const addTxTag = ({ tag }: { tag: string }): Result<string> => {
	const wallet = getOnChainWallet();
	return wallet.addTxTag({
		tag,
	});
};

/**
 * Removes a specified tag to the current transaction.
 * @param {string} tag
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const removeTxTag = ({ tag }: { tag: string }): Result<string> => {
	const wallet = getOnChainWallet();
	return wallet.removeTxTag({
		tag,
	});
};

/**
 * Updates the fee rate for the current transaction to the preferred value if none set.
 * @returns {Result<string>}
 */
export const setupFeeForOnChainTransaction = (): Result<string> => {
	const wallet = getOnChainWallet();
	const transaction = wallet.transaction.data;
	const fees = getFeesStore().onchain;
	const { transactionSpeed, customFeeRate } = getSettingsStore();
	const preferredFeeRate =
		transactionSpeed === ETransactionSpeed.custom
			? customFeeRate
			: fees[transactionSpeed];
	const selectedFeeId = txSpeedToFeeId(getSettingsStore().transactionSpeed);
	const satsPerByte =
		transaction.selectedFeeId === 'none'
			? preferredFeeRate
			: transaction.satsPerByte;
	return wallet.setupFeeForOnChainTransaction({ satsPerByte, selectedFeeId });
};

const txSpeedToFeeId = (txSpeed: ETransactionSpeed): EFeeId => {
	switch (txSpeed) {
		case ETransactionSpeed.slow:
			return EFeeId.slow;
		case ETransactionSpeed.normal:
			return EFeeId.normal;
		case ETransactionSpeed.fast:
			return EFeeId.fast;
		case ETransactionSpeed.custom:
			return EFeeId.custom;
		default:
			return EFeeId.none;
	}
};

/**
 * Saves block header information to storage.
 * @param {IHeader} header
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateHeader = ({
	header,
	selectedNetwork,
}: {
	header: IHeader;
	selectedNetwork?: TAvailableNetworks;
}): void => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const payload = {
		header,
		selectedNetwork,
	};
	dispatch({
		type: actions.UPDATE_HEADER,
		payload,
	});
};

/**
 * This method will reset all exchange rate data to the default.
 */
export const resetExchangeRates = (): Result<string> => {
	dispatch({
		type: actions.RESET_EXCHANGE_RATES,
	});

	return ok('');
};

/**
 * Used to update/replace mismatched addresses.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TGetImpactedAddressesRes} impactedAddresses
 * @returns {Promise<Result<string>>}
 */
export const replaceImpactedAddresses = async ({
	selectedWallet,
	selectedNetwork,
	impactedAddresses,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	impactedAddresses: TGetImpactedAddressesRes; // Retrieved from getImpactedAddresses
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});

		const newAddresses = currentWallet.addresses[selectedNetwork];
		const newChangeAddresses = currentWallet.changeAddresses[selectedNetwork];

		const newAddressIndex = currentWallet.addressIndex[selectedNetwork];
		const newChangeAddressIndex =
			currentWallet.changeAddressIndex[selectedNetwork];

		const allImpactedAddresses = impactedAddresses.impactedAddresses;
		const allImpactedChangeAddresses =
			impactedAddresses.impactedChangeAddresses;

		allImpactedAddresses.map(({ addressType, addresses }) => {
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			addresses.map((impactedAddress) => {
				const invalidScriptHash = impactedAddress.storedAddress.scriptHash;
				const validScriptHash = impactedAddress.generatedAddress.scriptHash;
				// Remove invalid address
				newAddresses[addressType] = removeKeyFromObject(
					invalidScriptHash,
					newAddresses[addressType],
				);
				// Add valid address data
				newAddresses[addressType][validScriptHash] =
					impactedAddress.generatedAddress;
				// Update address index info
				const currentAddressIndex = newAddressIndex[addressType].index;
				if (currentAddressIndex === impactedAddress.storedAddress.index) {
					newAddressIndex[addressType] = impactedAddress.generatedAddress;
				}
			});
		});

		allImpactedChangeAddresses.map(({ addressType, addresses }) => {
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			addresses.map((impactedAddress) => {
				const invalidScriptHash = impactedAddress.storedAddress.scriptHash;
				const validScriptHash = impactedAddress.generatedAddress.scriptHash;
				// Remove invalid address
				newChangeAddresses[addressType] = removeKeyFromObject(
					invalidScriptHash,
					newChangeAddresses[addressType],
				);
				// Add valid address data
				newChangeAddresses[addressType][validScriptHash] =
					impactedAddress.generatedAddress;
				// Update address index info
				const currentChangeAddressIndex =
					newChangeAddressIndex[addressType].index;
				if (currentChangeAddressIndex === impactedAddress.storedAddress.index) {
					newChangeAddressIndex[addressType] = impactedAddress.generatedAddress;
				}
			});
		});

		const payload = {
			newAddresses,
			newAddressIndex,
			newChangeAddresses,
			newChangeAddressIndex,
			selectedWallet,
			selectedNetwork,
		};

		dispatch({
			type: actions.REPLACE_IMPACTED_ADDRESSES,
			payload,
		});

		return ok('Replaced impacted addresses');
	} catch (e) {
		return err(e);
	}
};

/**
 * Will attempt to return saved wallet data from redux.
 * If not found, it will return the default value.
 * @async
 * @param {string} key
 * @returns {Promise<Result<IWalletData[K]>>}
 */
export const getWalletData = async <K extends keyof IWalletData>(
	key: string,
): Promise<Result<IWalletData[K]>> => {
	const keyValue = getKeyValue(key);
	try {
		const selectedWallet = getSelectedWallet();
		if (!(selectedWallet in getStore().wallet.wallets)) {
			return err('Unable to locate wallet data.');
		}
		if (keyValue === 'feeEstimates') {
			// @ts-ignore
			return ok(getFeesStore().onchain);
		}
		const wallet = getStore().wallet.wallets[selectedWallet];
		if (keyValue in wallet) {
			const keyValueType = typeof wallet[keyValue];
			const tArr = ['string', 'number', 'boolean', 'undefined'];
			if (tArr.includes(keyValueType)) {
				return ok(wallet[keyValue]);
			} else {
				const selectedNetwork = getSelectedNetwork();
				return ok(wallet[keyValue][selectedNetwork]);
			}
		}
		const defaultWalletData = getDefaultWalletData();
		return ok(defaultWalletData[keyValue]);
	} catch (e) {
		console.error('Error in getWalletData:', e);
		return ok(getDefaultWalletData()[keyValue]);
	}
};

/**
 * Will attempt to set wallet data in redux.
 * @param {string} key
 * @param {IWalletData[K]} data
 * @returns {Promise<Result<boolean>>}
 */
export const setWalletData = async <K extends keyof IWalletData>(
	key: string,
	data: IWalletData[K],
): Promise<Result<boolean>> => {
	if (!key) {
		return err('Invalid key.');
	}
	const { walletName, network, value } = getStorageKeyValues(key);
	try {
		switch (value) {
			case 'header':
				updateHeader({
					header: data as IHeader,
					selectedNetwork: getNetworkFromBeignet(network),
				});
				break;
			case 'exchangeRates':
				updateExchangeRates(data as IExchangeRates);
				break;
			case 'feeEstimates':
				updateOnchainFeeEstimates({
					selectedNetwork: getNetworkFromBeignet(network),
					feeEstimates: data as IOnchainFees,
					forceUpdate: true,
				});
				break;
			default:
				const payload = {
					selectedWallet: walletName,
					network: getNetworkFromBeignet(network),
					value,
					data,
				};
				dispatch({
					type: actions.UPDATE_WALLET_DATA,
					payload,
				});
		}

		return ok(true);
	} catch (e) {
		console.error('Error in setWalletData:', e);
		return err(e);
	}
};

export const getNetworkFromBeignet = (
	network: EAvailableNetworks,
): TAvailableNetworks => {
	switch (network) {
		case EAvailableNetworks.bitcoin:
		case EAvailableNetworks.bitcoinMainnet:
			return EBitkitAvailableNetworks.bitcoin;
		case EAvailableNetworks.testnet:
		case EAvailableNetworks.bitcoinTestnet:
			return EBitkitAvailableNetworks.bitcoinTestnet;
		case EAvailableNetworks.regtest:
		case EAvailableNetworks.bitcoinRegtest:
			return EBitkitAvailableNetworks.bitcoinRegtest;
	}
};

/**
 * Returns value after last hyphen in a string.
 * @param {string} key
 * @returns {string}
 */
export const getKeyValue = (key: string): string => {
	const parts = key.split('-');
	return parts[parts.length - 1];
};

export const getWalletDataKey = (key: keyof IWalletData): string => {
	return getOnChainWallet().getWalletDataKey(key);
};

export const getDefaultWalletStorageData = (
	name: string,
	network: EAvailableNetworks,
): any => {
	const obj: { [key: string]: any } = {};
	const data: IWalletData = cloneDeep(getDefaultWalletData());
	(Object.keys(data) as Array<keyof IWalletData>).forEach((key) => {
		const storageKey = getWalletDataStorageKey(name, network, key);
		obj[storageKey] = getDefaultWalletData()[key];
	});
	return obj;
};
