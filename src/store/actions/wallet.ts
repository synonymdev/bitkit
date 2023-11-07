import { err, ok, Result } from '@synonymdev/result';

import actions from './actions';
import {
	EPaymentType,
	IAddresses,
	IAddress,
	ICreateWallet,
	IFormattedTransaction,
	IFormattedTransactions,
	IKeyDerivationPath,
	ISendTransaction,
	IUtxo,
	EAddressType,
	IBoostedTransactions,
	EBoostType,
	TWalletName,
	IWalletStore,
	TProcessUnconfirmedTransactions,
} from '../types/wallet';
import {
	blockHeightToConfirmations,
	confirmationsToBlockHeight,
	createDefaultWallet,
	formatTransactions,
	generateAddresses,
	getAddressIndexInfo,
	getCurrentWallet,
	getGapLimit,
	getKeyDerivationPathObject,
	getNextAvailableAddress,
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
	getBlocktankStore,
	getDispatch,
	getFeesStore,
	getSettingsStore,
	getWalletStore,
} from '../helpers';
import { TAvailableNetworks } from '../../utils/networks';
import { objectKeys } from '../../utils/objectKeys';
import {
	getOnchainTransactionData,
	getTotalFee,
	updateFee,
} from '../../utils/wallet/transactions';
import {
	IGenerateAddresses,
	IGenerateAddressesResponse,
} from '../../utils/types';
import { getExchangeRates } from '../../utils/exchange-rate';
import { objectsMatch, removeKeyFromObject } from '../../utils/helpers';
import {
	getAddressHistory,
	getTransactions,
	getUtxos,
	transactionExists,
} from '../../utils/wallet/electrum';
import { EFeeId } from '../types/fees';
import { ETransactionSpeed } from '../types/settings';
import { IHeader } from '../../utils/types/electrum';
import {
	GAP_LIMIT,
	GENERATE_ADDRESS_AMOUNT,
} from '../../utils/wallet/constants';
import { getBoostedTransactionParents } from '../../utils/boost';
import { updateSlashPayConfig2 } from '../../utils/slashtags2';
import {
	addressTypes,
	getDefaultWalletShape,
	TAddressIndexInfo,
} from '../shapes/wallet';
import { TGetImpactedAddressesRes } from '../types/checks';
import { updateActivityItem, updateActivityList } from './activity';
import { showToast } from '../../utils/notifications';
import { getActivityItemById } from '../../utils/activity';
import { getFakeTransaction } from '../../utils/wallet/testing';
import { EActivityType, TOnchainActivityItem } from '../types/activity';
import i18n from '../../utils/i18n';

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
 * @param {number} [addressAmount]
 * @param {number} [changeAddressAmount]
 * @param {string} [bip39Passphrase]
 * @param {Partial<IAddressTypes>} [addressTypesToCreate]
 * @return {Promise<Result<string>>}
 */
export const createWallet = async ({
	walletName = getDefaultWalletShape().id,
	mnemonic,
	bip39Passphrase = '',
	restore = false,
	addressAmount = GENERATE_ADDRESS_AMOUNT,
	changeAddressAmount = GENERATE_ADDRESS_AMOUNT,
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
			addressAmount,
			changeAddressAmount,
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

export const updateExchangeRates = async (): Promise<Result<string>> => {
	const res = await getExchangeRates();

	if (res.isErr()) {
		return err(res.error);
	}

	dispatch({
		type: actions.UPDATE_WALLET,
		payload: { exchangeRates: res.value },
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
	selectedWallet,
	selectedNetwork,
	addressType,
	keyDerivationPath,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
	keyDerivationPath?: IKeyDerivationPath;
}): Promise<Result<IAddress>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
		}
		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});

		const getGapLimitResponse = getGapLimit({
			selectedWallet,
			selectedNetwork,
			addressType,
		});
		if (getGapLimitResponse.isErr()) {
			return err(getGapLimitResponse.error.message);
		}
		const { addressDelta } = getGapLimitResponse.value;

		// If the address delta exceeds the default gap limit, only return the current address index.
		if (addressDelta >= GAP_LIMIT) {
			const addressIndex = currentWallet.addressIndex[selectedNetwork];
			const receiveAddress = addressIndex[addressType];
			return ok(receiveAddress);
		}

		const { path } = addressTypes[addressType];
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
		const addresses = currentWallet.addresses[selectedNetwork][addressType];
		const currentAddressIndex =
			currentWallet.addressIndex[selectedNetwork][addressType].index;
		const nextAddressIndex = Object.values(addresses).find((address) => {
			return address.index === currentAddressIndex + 1;
		});

		// Check if the next address index already exists or if it needs to be generated.
		if (nextAddressIndex) {
			// Update addressIndex and return the address content.
			dispatch({
				type: actions.UPDATE_ADDRESS_INDEX,
				payload: {
					addressIndex: nextAddressIndex,
					addressType,
				},
			});
			return ok(nextAddressIndex);
		}

		// We need to generate, save and return the new address.
		const addAddressesRes = await addAddresses({
			addressAmount: 1,
			changeAddressAmount: 0,
			addressIndex: currentAddressIndex + 1,
			changeAddressIndex: 0,
			selectedNetwork,
			selectedWallet,
			keyDerivationPath,
			addressType,
		});
		if (addAddressesRes.isErr()) {
			return err(addAddressesRes.error.message);
		}
		const addressKeys = Object.keys(addAddressesRes.value.addresses);
		// If for any reason the phone was unable to generate the new address, return error.
		if (!addressKeys.length) {
			return err('Unable to generate addresses at this time.');
		}
		const newAddressIndex = addAddressesRes.value.addresses[addressKeys[0]];
		dispatch({
			type: actions.UPDATE_ADDRESS_INDEX,
			payload: {
				addressIndex: newAddressIndex,
				addressType,
			},
		});
		return ok(newAddressIndex);
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
		selectedWallet,
		selectedNetwork,
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
	selectedWallet,
	selectedNetwork,
}: {
	balance: number;
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
		const payload = {
			balance,
			selectedNetwork,
			selectedWallet,
		};
		dispatch({
			type: actions.UPDATE_WALLET_BALANCE,
			payload,
		});

		return ok('Successfully updated balance.');
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
 * @returns {Promise<Result<TProcessUnconfirmedTransactions>>
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
			selectedNetwork,
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
 * Checks existing unconfirmed transactions that have been received and removes any that have >= 6 confirmations.
 * If the tx is reorg'd or bumped from the mempool and no longer exists, the transaction
 * will be removed from the store and updated in the activity list.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const checkUnconfirmedTransactions = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const processRes = await processUnconfirmedTransactions({
			selectedNetwork,
			selectedWallet,
		});
		if (processRes.isErr()) {
			return err(processRes.error.message);
		}

		const { unconfirmedTxs, outdatedTxs, ghostTxs } = processRes.value;
		if (outdatedTxs.length) {
			// Notify user that a reorg has occurred and that the transaction has been pushed back into the mempool.
			showToast({
				type: 'info',
				title: i18n.t('wallet:reorg_detected'),
				description: i18n.t('wallet:reorg_msg_begin', {
					count: outdatedTxs.length,
				}),
				autoHide: false,
			});
			//We need to update the height of the transactions that were reorg'd out.
			await updateTransactionHeights(outdatedTxs);
		}
		if (ghostTxs.length) {
			// Notify user that a transaction has been removed from the mempool.
			showToast({
				type: 'error',
				title: i18n.t('wallet:activity_removed_title'),
				description: i18n.t('wallet:activity_removed_msg', {
					count: ghostTxs.length,
				}),
				autoHide: false,
			});
			//We need to update the ghost transactions in the store & activity-list and rescan the addresses to get the correct balance.
			await updateGhostTransactions({
				selectedWallet,
				selectedNetwork,
				txIds: ghostTxs,
			});
		}
		const payload = {
			selectedNetwork,
			selectedWallet,
			unconfirmedTransactions: unconfirmedTxs,
		};

		dispatch({
			type: actions.UPDATE_UNCONFIRMED_TRANSACTIONS,
			payload,
		});
		return ok('Successfully updated unconfirmed transactions.');
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
			selectedWallet,
			selectedNetwork,
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
				selectedNetwork,
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
	selectedWallet,
	selectedNetwork,
}: {
	scanAllAddresses?: boolean;
	replaceStoredTransactions?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string | undefined>> => {
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

	//Check existing unconfirmed transactions and remove any that are confirmed.
	//If the tx is reorg'd or bumped from the mempool and no longer exists, the transaction will be removed from the store and updated in the activity list.
	await checkUnconfirmedTransactions({ selectedWallet, selectedNetwork });

	const history = await getAddressHistory({
		selectedNetwork,
		selectedWallet,
		scanAllAddresses: scanAllAddresses || replaceStoredTransactions,
	});
	if (history.isErr()) {
		return err(history.error.message);
	}
	if (!history.value.length) {
		return ok(undefined);
	}

	const getTransactionsResponse = await getTransactions({
		txHashes: history.value,
		selectedNetwork,
	});
	if (getTransactionsResponse.isErr()) {
		return err(getTransactionsResponse.error.message);
	}

	const formatTransactionsResponse = await formatTransactions({
		selectedNetwork,
		selectedWallet,
		transactions: getTransactionsResponse.value.data,
	});
	if (formatTransactionsResponse.isErr()) {
		return err(formatTransactionsResponse.error.message);
	}
	const transactions = formatTransactionsResponse.value;

	// Add unconfirmed transactions.
	// No need to wait for this to finish.
	addUnconfirmedTransactions({
		selectedNetwork,
		selectedWallet,
		transactions,
	});

	if (replaceStoredTransactions) {
		// No need to check the existing txs. Update with the returned formatTransactionsResponse.
		dispatch({
			type: actions.UPDATE_TRANSACTIONS,
			payload: {
				transactions,
				selectedNetwork,
				selectedWallet,
			},
		});
		updateSlashPayConfig2({ selectedWallet, selectedNetwork });
		return ok(undefined);
	}

	// Handle new or updated transactions.
	const formattedTransactions: IFormattedTransactions = {};
	const storedTransactions = currentWallet.transactions[selectedNetwork];
	const blocktankOrders = getBlocktankStore().orders;

	let notificationTxid: string | undefined;

	Object.keys(transactions).forEach((txid) => {
		// check if tx is a payment from Blocktank (i.e. transfer to savings)
		const isTransferToSavings = !!blocktankOrders.find((order) => {
			return !!transactions[txid].vin.find(
				(input) => input.txid === order.channel?.close?.txId,
			);
		});

		//If the tx is new or the tx now has a block height (state changed to confirmed)
		if (
			!storedTransactions[txid] ||
			storedTransactions[txid].height !== transactions[txid].height
		) {
			formattedTransactions[txid] = {
				...transactions[txid],
				// Keep the previous timestamp if the tx is not new.
				timestamp:
					storedTransactions[txid]?.timestamp ??
					transactions[txid]?.timestamp ??
					Date.now(),
			};
		}

		// if the tx is new, incoming but not from a transfer - show notification
		if (
			!storedTransactions[txid] &&
			transactions[txid].type === EPaymentType.received &&
			!isTransferToSavings
		) {
			notificationTxid = txid;
		}
	});

	//No new or updated transactions
	if (!Object.keys(formattedTransactions).length) {
		return ok(undefined);
	}

	dispatch({
		type: actions.UPDATE_TRANSACTIONS,
		payload: {
			transactions: formattedTransactions,
			selectedNetwork,
			selectedWallet,
		},
	});

	updateSlashPayConfig2({ selectedWallet, selectedNetwork });

	return ok(notificationTxid);
};

/**
 * Deletes a given on-chain trnsaction by id.
 * @param {string} txid
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const deleteOnChainTransactionById = async ({
	txid,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		txid,
		selectedNetwork,
		selectedWallet,
	};
	dispatch({
		type: actions.DELETE_ON_CHAIN_TRANSACTION,
		payload,
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
	selectedWallet,
	selectedNetwork,
}: {
	newTxId: string;
	oldTxId: string;
	type?: EBoostType;
	fee: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const boostedTransactions =
			getWalletStore().wallets[selectedWallet].boostedTransactions[
				selectedNetwork
			];
		const parentTransactions = getBoostedTransactionParents({
			txid: oldTxId,
			boostedTransactions,
		});
		parentTransactions.push(oldTxId);
		const boostedTransaction: IBoostedTransactions = {
			[oldTxId]: {
				parentTransactions: parentTransactions,
				childTransaction: newTxId,
				type,
				fee,
			},
		};
		const payload = {
			boostedTransaction,
			selectedNetwork,
			selectedWallet,
		};
		dispatch({
			type: actions.ADD_BOOSTED_TRANSACTION,
			payload,
		});
	} catch (e) {}
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @param {string[]} [inputTxHashes]
 * @param {IUtxo[]} [utxos]
 * @param {boolean} [rbf]
 * @param satsPerByte
 * @returns {Promise<Result<Partial<ISendTransaction>>>}
 */
export const setupOnChainTransaction = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	inputTxHashes,
	utxos,
	rbf = false,
	satsPerByte = 1,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType; // Preferred address type for change address.
	inputTxHashes?: string[]; // Used to pre-specify inputs to use by tx_hash
	utxos?: IUtxo[]; // Used to pre-specify utxos to use
	rbf?: boolean; // Enable or disable rbf.
	satsPerByte?: number; // Set the sats per byte for the transaction.
} = {}): Promise<Result<Partial<ISendTransaction>>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!addressType) {
			addressType = getSelectedAddressType({ selectedWallet, selectedNetwork });
		}

		const { currentWallet } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});

		const transaction = currentWallet.transaction[selectedNetwork];

		// Gather required inputs.
		let inputs: IUtxo[] = [];
		if (inputTxHashes) {
			// If specified, filter for the desired tx_hash and push the utxo as an input.
			inputs = currentWallet.utxos[selectedNetwork].filter((utxo) => {
				return inputTxHashes.includes(utxo.tx_hash);
			});
		} else if (utxos) {
			inputs = utxos;
		}

		if (!inputs.length) {
			// If inputs were previously selected, leave them.
			if (transaction.inputs.length > 0) {
				inputs = transaction.inputs;
			} else {
				// Otherwise, lets use our available utxo's.
				inputs = currentWallet.utxos[selectedNetwork];
			}
		}

		if (!inputs.length) {
			return err('No inputs specified.');
		}

		const currentChangeAddresses =
			currentWallet.changeAddresses[selectedNetwork];

		const addressTypeKeys = objectKeys(EAddressType);
		let changeAddresses: IAddresses = {};
		addressTypeKeys.forEach((key) => {
			changeAddresses = {
				...changeAddresses,
				...currentChangeAddresses[key],
			};
		});
		const changeAddressesArr = Object.values(changeAddresses).map(
			({ address }) => address,
		);

		const changeAddressIndexContent =
			currentWallet.changeAddressIndex[selectedNetwork][addressType];
		// Set the current change address.
		let changeAddress = changeAddressIndexContent.address;

		if (!changeAddress || changeAddressIndexContent.index < 0) {
			// It's possible we haven't set the change address index yet. Generate one on the fly.
			const generateAddressResponse = await generateAddresses({
				selectedWallet,
				selectedNetwork,
				addressAmount: 0,
				changeAddressAmount: 1,
				addressType,
			});
			if (generateAddressResponse.isErr()) {
				return err(generateAddressResponse.error.message);
			}
			changeAddress = generateAddressResponse.value.changeAddresses[0].address;
		}
		if (!changeAddress) {
			return err('Unable to successfully generate a change address.');
		}

		// Set the minimum fee.
		const fee = getTotalFee({
			satsPerByte,
			message: '',
		});

		const lightningInvoice =
			currentWallet.transaction[selectedNetwork]?.lightningInvoice;

		let outputs = currentWallet.transaction[selectedNetwork].outputs || [];
		if (!lightningInvoice) {
			//Remove any potential change address that may have been included from a previous tx attempt.
			outputs = outputs.filter((output) => {
				if (output.address && !changeAddressesArr.includes(output.address)) {
					return output;
				}
			});
		}

		const payload = {
			selectedNetwork,
			selectedWallet,
			inputs,
			changeAddress,
			fee,
			outputs,
			rbf,
			satsPerByte,
		};

		dispatch({
			type: actions.SETUP_ON_CHAIN_TRANSACTION,
			payload,
		});

		return ok(payload);
	} catch (e) {
		return err(e);
	}
};

/**
 * Retrieves the next available change address data.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @returns {Promise<Result<IAddress>>}
 */
export const getChangeAddress = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
}): Promise<Result<IAddress>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!addressType) {
		addressType = getSelectedAddressType({ selectedWallet, selectedNetwork });
	}

	const { currentWallet } = getCurrentWallet({
		selectedWallet,
		selectedNetwork,
	});

	const changeAddressIndexContent =
		currentWallet.changeAddressIndex[selectedNetwork][addressType];

	if (
		changeAddressIndexContent?.address &&
		changeAddressIndexContent.index >= 0
	) {
		return ok(changeAddressIndexContent);
	}

	// It's possible we haven't set the change address index yet. Generate one on the fly.
	const generateAddressResponse = await generateAddresses({
		selectedWallet,
		selectedNetwork,
		addressAmount: 0,
		changeAddressAmount: 1,
		addressType,
	});
	if (generateAddressResponse.isErr()) {
		console.log(generateAddressResponse.error.message);
		return err('Unable to successfully generate a change address.');
	}
	return ok(generateAddressResponse.value.changeAddresses[0]);
};

/**
 * This updates the transaction state used for sending.
 * @param {Partial<ISendTransaction>} transaction
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<string>>}
 */
export const updateSendTransaction = ({
	transaction,
	selectedWallet,
	selectedNetwork,
}: {
	transaction: Partial<ISendTransaction>;
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

		//Add output if specified
		if (transaction.outputs) {
			const currentWallet = getWalletStore().wallets[selectedWallet];
			const currentTransaction = currentWallet.transaction[selectedNetwork];
			const outputs = currentTransaction.outputs.concat();
			transaction.outputs.forEach((output) => {
				outputs[output.index] = output;
			});
			transaction.outputs = outputs;
		}

		dispatch({
			type: actions.UPDATE_SEND_TRANSACTION,
			payload: {
				transaction,
				selectedNetwork,
				selectedWallet,
			},
		});

		return ok('Transaction updated');
	} catch (e) {
		return err(e);
	}
};

export const updateSelectedFeeId = async ({
	feeId,
	selectedWallet,
	selectedNetwork,
}: {
	feeId: EFeeId;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const transactionResponse = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transactionResponse.isErr()) {
			return err(transactionResponse.error.message);
		}
		const transaction = transactionResponse.value;
		transaction.selectedFeeId = feeId;
		updateSendTransaction({ transaction });
		return ok('Fee updated');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * This completely resets the send transaction state for the specified wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Result<string>}
 */
export const resetSendTransaction = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): Result<string> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	dispatch({
		type: actions.RESET_SEND_TRANSACTION,
		payload: {
			selectedNetwork,
			selectedWallet,
		},
	});
	return ok('Transaction reseted');
};

export const updateSelectedAddressType = async ({
	addressType,
	selectedWallet,
	selectedNetwork,
}: {
	addressType: EAddressType;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	// Ensure zero index addresses are set when switching address types.
	await addAddresses({
		selectedWallet,
		selectedNetwork,
		addressType,
		addressAmount: 1,
		changeAddressAmount: 1,
		addressIndex: 0,
		changeAddressIndex: 0,
	});

	dispatch({
		type: actions.UPDATE_SELECTED_ADDRESS_TYPE,
		payload: {
			addressType,
			selectedNetwork,
			selectedWallet,
		},
	});
};

/**
 * Removes the specified input from the current transaction.
 * @param {IUtxo} input
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const removeTxInput = ({
	input,
	selectedWallet,
	selectedNetwork,
}: {
	input: IUtxo;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<IUtxo[]> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const txData = getOnchainTransactionData({
			selectedNetwork,
			selectedWallet,
		});
		if (txData.isErr()) {
			return err(txData.error.message);
		}
		const txInputs = txData.value?.inputs ?? [];
		const newInputs = txInputs.filter((txInput) => {
			if (!objectsMatch(input, txInput)) {
				return txInput;
			}
		});
		updateSendTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: {
				inputs: newInputs,
			},
		});
		return ok(newInputs);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Adds a specified input to the current transaction.
 * @param {IUtxo} input
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addTxInput = ({
	input,
	selectedWallet,
	selectedNetwork,
}: {
	input: IUtxo;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<IUtxo[]> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const txData = getOnchainTransactionData({
			selectedNetwork,
			selectedWallet,
		});
		if (txData.isErr()) {
			return err(txData.error.message);
		}
		const inputs = txData.value?.inputs ?? [];
		const newInputs = [...inputs, input];
		updateSendTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: {
				inputs: newInputs,
			},
		});
		return ok(newInputs);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Adds a specified tag to the current transaction.
 * @param {string} tag
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addTxTag = ({
	tag,
	selectedWallet,
	selectedNetwork,
}: {
	tag: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<string> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const txData = getOnchainTransactionData({
			selectedNetwork,
			selectedWallet,
		});
		if (txData.isErr()) {
			return err(txData.error.message);
		}

		let tags = [...txData.value.tags, tag];
		tags = [...new Set(tags)]; // remove duplicates

		updateSendTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: {
				...txData,
				tags,
			},
		});
		return ok('Tag successfully added');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Removes a specified tag to the current transaction.
 * @param {string} tag
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const removeTxTag = ({
	tag,
	selectedWallet,
	selectedNetwork,
}: {
	tag: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<string> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const txData = getOnchainTransactionData({
			selectedNetwork,
			selectedWallet,
		});
		if (txData.isErr()) {
			return err(txData.error.message);
		}

		const tags = txData.value.tags;
		const newTags = tags.filter((t) => t !== tag);

		updateSendTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: {
				...txData,
				tags: newTags,
			},
		});
		return ok('Tag successfully added');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Updates the fee rate for the current transaction to the preferred value if none set.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const setupFeeForOnChainTransaction = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
} = {}): Result<string> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const transactionDataResponse = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		const transaction = transactionDataResponse.value;

		const fees = getFeesStore().onchain;
		const { transactionSpeed, customFeeRate } = getSettingsStore();
		const preferredFeeRate =
			transactionSpeed === ETransactionSpeed.custom
				? customFeeRate
				: fees[transactionSpeed];

		const satsPerByte =
			transaction.selectedFeeId === 'none'
				? preferredFeeRate
				: transaction.satsPerByte;
		const selectedFeeId =
			transaction.selectedFeeId === 'none'
				? EFeeId[transactionSpeed]
				: transaction.selectedFeeId;

		const res = updateFee({
			satsPerByte,
			selectedFeeId,
			selectedNetwork,
			selectedWallet,
		});

		if (res.isErr()) {
			console.log(res.error.message);
			return err(res.error.message);
		}

		return ok('Fee has been changed successfully');
	} catch (e) {
		return err(e);
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
 * Will ensure that both address and change address indexes are set.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {EAddressType} [addressType]
 * @param {TAddressIndexInfo} [addressIndexInfo]
 */
export const setZeroIndexAddresses = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	addressIndexInfo,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	addressType?: EAddressType;
	addressIndexInfo?: TAddressIndexInfo;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!addressType) {
		addressType = getSelectedAddressType({ selectedNetwork, selectedWallet });
	}

	if (!addressIndexInfo) {
		addressIndexInfo = getAddressIndexInfo({
			selectedNetwork,
			selectedWallet,
			addressType,
		});
	}

	const addressIndex = addressIndexInfo.addressIndex;
	const changeAddressIndex = addressIndexInfo.changeAddressIndex;

	if (addressIndex.index >= 0 && changeAddressIndex.index >= 0) {
		return ok('No need to set indexes.');
	}

	const currentWallet = getWalletStore().wallets[selectedWallet];
	const payload: {
		addressIndex?: IAddress;
		changeAddressIndex?: IAddress;
	} = {};

	if (addressIndex.index < 0) {
		const addresses = currentWallet?.addresses[selectedNetwork][addressType];
		const address = Object.values(addresses).find((a) => a.index === 0);
		if (address) {
			payload.addressIndex = address;
		}
	}
	if (changeAddressIndex.index < 0) {
		const changeAddresses =
			currentWallet?.changeAddresses[selectedNetwork][addressType];
		const address = Object.values(changeAddresses).find((a) => a.index === 0);
		if (address) {
			payload.changeAddressIndex = address;
		}
	}

	dispatch({
		type: actions.UPDATE_ADDRESS_INDEX,
		payload: {
			...payload,
			addressType,
		},
	});

	return ok('Set Zero Index Addresses.');
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
