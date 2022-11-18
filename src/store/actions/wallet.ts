import actions from './actions';
import {
	EPaymentType,
	EWallet,
	IAddress,
	IAddressContent,
	ICreateWallet,
	IFormattedTransaction,
	IKeyDerivationPath,
	IBitcoinTransactionData,
	IUtxo,
	TAddressType,
	IBoostedTransaction,
	EBoost,
} from '../types/wallet';
import {
	createDefaultWallet,
	formatTransactions,
	generateAddresses,
	getAddressIndexInfo,
	getAddressTypes,
	getCurrentWallet,
	getGapLimit,
	getKeyDerivationPathObject,
	getNextAvailableAddress,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
	ITransaction,
	refreshWallet,
	removeDuplicateAddresses,
} from '../../utils/wallet';
import { getDispatch, getStore } from '../helpers';
import { TAvailableNetworks } from '../../utils/networks';
import { err, ok, Result } from '@synonymdev/result';
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
import { objectsMatch } from '../../utils/helpers';
import {
	getAddressHistory,
	getTransactions,
	getUtxos,
} from '../../utils/wallet/electrum';
import { EFeeIds } from '../types/fees';
import { IHeader } from '../../utils/types/electrum';
import { toggleView } from './user';
import {
	GAP_LIMIT,
	GENERATE_ADDRESS_AMOUNT,
} from '../../utils/wallet/constants';
import { getBoostedTransactionParents } from '../../utils/boost';
import { updateSlashPayConfig } from '../../utils/slashtags';
import { sdk } from '../../components/SlashtagsProvider';
import { TAddressIndexInfo } from '../shapes/wallet';

const dispatch = getDispatch();

export const updateWallet = (payload): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		await dispatch({
			type: actions.UPDATE_WALLET,
			payload,
		});
		resolve(ok(''));
	});
};

/**
 * Creates and stores a newly specified wallet.
 * @param {string} [wallet]
 * @param {number} [addressAmount]
 * @param {number} [changeAddressAmount]
 * @param {string} [mnemonic]
 * @param {string} [bip39Passphrase]
 * @param {IAddressType} [addressTypes]
 * @return {Promise<Result<string>>}
 */
export const createWallet = async ({
	walletName = EWallet.defaultWallet,
	addressAmount = GENERATE_ADDRESS_AMOUNT,
	changeAddressAmount = GENERATE_ADDRESS_AMOUNT,
	mnemonic = '',
	bip39Passphrase = '',
	addressTypes,
}: ICreateWallet): Promise<Result<string>> => {
	if (!addressTypes) {
		addressTypes = getAddressTypes();
	}
	try {
		const response = await createDefaultWallet({
			walletName,
			addressAmount,
			changeAddressAmount,
			mnemonic,
			bip39Passphrase,
			addressTypes,
		});
		if (response.isErr()) {
			return err(response.error.message);
		}
		await dispatch({
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

	await dispatch({
		type: actions.UPDATE_WALLET,
		payload: { exchangeRates: res.value },
	});

	return ok('Successfully updated the exchange rate.');
};

/**
 * This method updates the next available (zero-balance) address & changeAddress index.
 * @async
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TAddressType} [addressType]
 * @return {string}
 */
export const updateAddressIndexes = async ({
	selectedWallet,
	selectedNetwork,
	addressType, //If this param is left undefined it will update the indexes for all stored address types.
}: {
	selectedWallet?: string | undefined;
	selectedNetwork?: TAvailableNetworks | undefined;
	addressType?: TAddressType | undefined;
}): Promise<Result<string>> => {
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
	const addressTypes = getAddressTypes();
	let addressTypesToCheck = Object.keys(addressTypes);
	if (addressType) {
		addressTypesToCheck = await Promise.all(
			addressTypesToCheck.filter(
				(_addressType) => _addressType === addressType,
			),
		);
	}

	let updated = false;

	const promises = addressTypesToCheck.map(async (addressTypeKey) => {
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

		const { type } = addressTypes[addressTypeKey];
		let addressIndex = currentWallet.addressIndex[selectedNetwork][type];
		let changeAddressIndex =
			currentWallet.changeAddressIndex[selectedNetwork][type];
		let lastUsedAddressIndex =
			currentWallet.lastUsedAddressIndex[selectedNetwork][type];
		let lastUsedChangeAddressIndex =
			currentWallet.lastUsedChangeAddressIndex[selectedNetwork][type];

		if (
			currentWallet.addressIndex[selectedNetwork][type]?.index < 0 ||
			currentWallet.changeAddressIndex[selectedNetwork][type]?.index < 0 ||
			response.value?.addressIndex?.index >
				currentWallet.addressIndex[selectedNetwork][type]?.index ||
			response.value?.changeAddressIndex?.index >
				currentWallet.changeAddressIndex[selectedNetwork][type]?.index ||
			response.value?.lastUsedAddressIndex?.index >
				currentWallet.lastUsedAddressIndex[selectedNetwork][type]?.index ||
			response.value?.lastUsedChangeAddressIndex?.index >
				currentWallet.lastUsedChangeAddressIndex[selectedNetwork][type]?.index
		) {
			if (response.value?.addressIndex) {
				addressIndex = response.value.addressIndex;
			}

			if (response.value?.changeAddressIndex) {
				changeAddressIndex = response.value?.changeAddressIndex;
			}

			if (response.value?.lastUsedAddressIndex) {
				lastUsedAddressIndex = response.value.lastUsedAddressIndex;
			}

			if (response.value?.lastUsedChangeAddressIndex) {
				lastUsedChangeAddressIndex = response.value?.lastUsedChangeAddressIndex;
			}

			await dispatch({
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

export const generateNewReceiveAddress = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	keyDerivationPath,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
	addressType?: TAddressType;
	keyDerivationPath?: IKeyDerivationPath;
}): Promise<Result<IAddressContent>> => {
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
		const addressTypes = getAddressTypes();
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
		const addresses: IAddress =
			currentWallet.addresses[selectedNetwork][addressType];
		const currentAddressIndex =
			currentWallet.addressIndex[selectedNetwork][addressType].index;
		const nextAddressIndex = await Promise.all(
			Object.values(addresses).filter((address) => {
				return address.index === currentAddressIndex + 1;
			}),
		);

		// Check if the next address index already exists or if it needs to be generated.
		if (nextAddressIndex?.length > 0) {
			// Update addressIndex and return the address content.
			await dispatch({
				type: actions.UPDATE_ADDRESS_INDEX,
				payload: {
					addressIndex: nextAddressIndex[0],
					addressType,
				},
			});
			return ok(nextAddressIndex[0]);
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
		await dispatch({
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
 * @param {string} [selectedWallet]
 * @param {number} [addressAmount]
 * @param {number} [changeAddressAmount]
 * @param {number} [addressIndex]
 * @param {number} [changeAddressIndex]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IKeyDerivationPath} [keyDerivationPath]
 * @param {TAddressType} [addressType]
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
	const addressTypes = getAddressTypes();
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
		addresses: { ...generatedAddresses.value.addresses },
		changeAddresses: { ...generatedAddresses.value.changeAddresses },
		selectedWallet,
		selectedNetwork,
	});

	if (removeDuplicateResponse.isErr()) {
		return err(removeDuplicateResponse.error.message);
	}

	const addresses = removeDuplicateResponse.value?.addresses ?? {};
	const changeAddresses = removeDuplicateResponse.value?.changeAddresses ?? {};
	if (!Object.keys(addresses).length && !Object.keys(changeAddresses).length) {
		return err('No addresses to add.');
	}

	const payload = {
		addresses,
		changeAddresses,
		addressType,
	};
	await dispatch({
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
export const updateUtxos = ({
	selectedWallet,
	selectedNetwork,
	scanAllAddresses = false,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
	scanAllAddresses?: boolean;
}): Promise<Result<{ utxos: IUtxo[]; balance: number }>> => {
	return new Promise(async (resolve) => {
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
			return resolve(err(utxoResponse.error));
		}
		const { utxos, balance } = utxoResponse.value;
		// Ensure we're not adding any duplicates.
		const filteredUtxos = utxos.filter(
			(utxo, index, _utxos) =>
				index ===
				_utxos.findIndex(
					(u) => u.scriptHash === utxo.scriptHash && u.tx_pos === utxo.tx_pos,
				),
		);
		const payload = {
			selectedWallet,
			selectedNetwork,
			utxos: filteredUtxos,
			balance,
		};
		await dispatch({
			type: actions.UPDATE_UTXOS,
			payload,
		});
		return resolve(ok(payload));
	});
};

/**
 * Clears the UTXO array and balance.
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<string>}
 */
export const clearUtxos = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<string> => {
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
	await dispatch({
		type: actions.UPDATE_UTXOS,
		payload,
	});
	return "Successfully cleared UTXO's.";
};

export const updateWalletBalance = ({
	balance = 0,
	selectedWallet = undefined,
	selectedNetwork = undefined,
}: {
	balance: number;
	selectedWallet?: string | undefined;
	selectedNetwork?: TAvailableNetworks | undefined;
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

export const updateTransactions = ({
	selectedWallet,
	selectedNetwork,
	scanAllAddresses = false,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
	scanAllAddresses?: boolean;
}): Promise<Result<IFormattedTransaction>> => {
	return new Promise(async (resolve) => {
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

		const history = await getAddressHistory({
			selectedNetwork,
			selectedWallet,
			scanAllAddresses,
		});

		if (history.isErr()) {
			return resolve(err(history.error.message));
		}

		if (!history?.value?.length) {
			return resolve(ok({}));
		}

		const getTransactionsResponse = await getTransactions({
			txHashes: history.value || [],
			selectedNetwork,
		});
		if (getTransactionsResponse.isErr()) {
			return resolve(err(getTransactionsResponse.error.message));
		}
		let transactions: ITransaction<ITransactionData>[] =
			getTransactionsResponse.value.data;

		if (!Array.isArray(transactions)) {
			return resolve(ok({}));
		}

		const formatTransactionsResponse = await formatTransactions({
			selectedNetwork,
			selectedWallet,
			transactions,
		});
		if (formatTransactionsResponse.isErr()) {
			return resolve(err(formatTransactionsResponse.error.message));
		}
		const formattedTransactions: IFormattedTransaction = {};

		const storedTransactions = currentWallet.transactions[selectedNetwork];

		let notificationTxid: string | undefined;

		Object.keys(formatTransactionsResponse.value).forEach((txid) => {
			//If the tx is new or the tx now has a block height (state changed to confirmed)
			if (
				!storedTransactions[txid] ||
				storedTransactions[txid].height !==
					formatTransactionsResponse.value[txid].height
			) {
				formattedTransactions[txid] = formatTransactionsResponse.value[txid];
			}

			// if the tx is new incoming - show notification
			if (
				!storedTransactions[txid] &&
				formatTransactionsResponse.value[txid].type === EPaymentType.received
			) {
				notificationTxid = txid;
			}
		});

		//No new or updated transactions
		if (!Object.keys(formattedTransactions)?.length) {
			return resolve(ok(storedTransactions));
		}

		const payload = {
			transactions: formattedTransactions,
			selectedNetwork,
			selectedWallet,
		};
		await dispatch({
			type: actions.UPDATE_TRANSACTIONS,
			payload,
		});
		if (notificationTxid) {
			toggleView({
				view: 'newTxPrompt',
				data: {
					isOpen: true,
					txid: notificationTxid,
				},
			});
		}

		updateSlashPayConfig(sdk);
		return resolve(ok(formattedTransactions));
	});
};

/**
 * Deletes a given on-chain trnsaction by id.
 * @param {string} txid
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const deleteOnChainTransactionById = async ({
	txid,
	selectedWallet = undefined,
	selectedNetwork = undefined,
}: {
	txid: string;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	try {
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
		await dispatch({
			type: actions.DELETE_ON_CHAIN_TRANSACTION,
			payload,
		});
	} catch (e) {}
};

/**
 * Adds a boosted transaction id to the boostedTransactions object.
 * @param {string} newTxId
 * @param {string} oldTxId
 * @param {EBoost} [type]
 * @param {number} fee
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addBoostedTransaction = async ({
	newTxId,
	oldTxId,
	type = EBoost.cpfp,
	fee,
	selectedWallet,
	selectedNetwork,
}: {
	newTxId: string;
	oldTxId: string;
	type?: EBoost;
	fee: number;
	selectedWallet?: string;
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
			getStore().wallet.wallets[selectedWallet].boostedTransactions[
				selectedNetwork
			];
		const parentTransactions = getBoostedTransactionParents({
			txid: oldTxId,
			boostedTransactions,
		});
		parentTransactions.push(oldTxId);
		const boostedTransaction: IBoostedTransaction = {
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
		await dispatch({
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
	selectedWallet = undefined,
}: {
	selectedWallet?: string;
}): Promise<void> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	await dispatch({
		type: actions.RESET_SELECTED_WALLET,
		payload: {
			selectedWallet,
		},
	});
	await createWallet({ walletName: selectedWallet });
	await refreshWallet({});
};

/**
 * This does not delete the stored mnemonic phrases on the device.
 * This resets the wallet store to defaultWalletStoreShape
 */
export const resetWalletStore = async (): Promise<Result<string>> => {
	dispatch({
		type: actions.RESET_WALLET_STORE,
	});
	await createWallet({});
	await refreshWallet({});
	return ok('');
};

export const setupOnChainTransaction = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	inputTxHashes,
	rbf = true,
	submitDispatch = true,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
	addressType?: TAddressType; // Preferred address type for change address.
	inputTxHashes?: string[]; // Used to pre-specify inputs to use by tx_hash
	rbf?: boolean; // Enable or disable rbf.
	submitDispatch?: boolean; //Should we dispatch this and update the store.
} = {}): Promise<Result<IBitcoinTransactionData>> => {
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
			inputs = currentWallet.utxos[selectedNetwork].filter((utxo) =>
				inputTxHashes.includes(utxo.tx_hash),
			);
		}

		if (!inputs.length) {
			// If inputs were previously selected, leave them.
			if (transaction?.inputs && transaction.inputs.length > 0) {
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

		const addressTypes = getAddressTypes();
		let changeAddresses: IAddress = {};
		await Promise.all(
			Object.keys(addressTypes).map((key) => {
				changeAddresses = {
					...changeAddresses,
					...currentChangeAddresses[key],
				};
			}),
		);
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
			satsPerByte: 1,
			message: '',
		});

		const lightningInvoice =
			currentWallet.transaction[selectedNetwork]?.lightningInvoice;

		let outputs = currentWallet.transaction[selectedNetwork].outputs || [];
		if (!lightningInvoice) {
			//Remove any potential change address that may have been included from a previous tx attempt.
			outputs = outputs.filter((output) => {
				if (output?.address && !changeAddressesArr.includes(output?.address)) {
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
		};

		if (submitDispatch) {
			dispatch({
				type: actions.SETUP_ON_CHAIN_TRANSACTION,
				payload,
			});
		}
		return ok(payload);
	} catch (e) {
		return err(e);
	}
};

/**
 * This updates the specified on-chain transaction.
 * @param selectedWallet
 * @param selectedNetwork
 * @param transaction
 * @return {Promise<void>}
 */
export const updateBitcoinTransaction = async ({
	transaction,
	selectedWallet,
	selectedNetwork,
}: {
	transaction: IBitcoinTransactionData;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		//Add output if specified
		if (transaction?.outputs) {
			let outputs =
				getStore().wallet.wallets[selectedWallet].transaction[selectedNetwork]
					.outputs || [];
			await Promise.all(
				transaction?.outputs.map((output) => {
					const outputIndex = output.index;
					outputs[outputIndex] = output;
				}),
			);
			transaction.outputs = outputs;
		}

		const payload = {
			selectedNetwork,
			selectedWallet,
			transaction,
		};

		dispatch({
			type: actions.UPDATE_ON_CHAIN_TRANSACTION,
			payload,
		});
	} catch {}
};

export const updateSelectedFeeId = async ({
	feeId = EFeeIds.none,
	selectedWallet,
	selectedNetwork,
}: {
	feeId?: EFeeIds;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
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
			return;
		}
		const transaction = transactionResponse.value;
		transaction.selectedFeeId = feeId;
		return await updateBitcoinTransaction({ transaction });
	} catch {}
};

export const resetOnChainTransaction = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
} = {}): void => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const payload = {
			selectedNetwork,
			selectedWallet,
		};
		dispatch({
			type: actions.RESET_ON_CHAIN_TRANSACTION,
			payload,
		});
	} catch {}
};

export const updateSelectedAddressType = ({
	addressType = EWallet.addressType,
	selectedWallet = undefined,
	selectedNetwork = undefined,
}: {
	addressType?: TAddressType;
	selectedWallet?: string | undefined;
	selectedNetwork?: TAvailableNetworks | undefined;
}): void => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const payload = {
			addressType,
			selectedNetwork,
			selectedWallet,
		};
		dispatch({
			type: actions.UPDATE_SELECTED_ADDRESS_TYPE,
			payload,
		});
	} catch {}
};

/**
 * Removes the specified input from the current transaction.
 * @param {IUtxo} input
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const removeTxInput = ({
	input,
	selectedWallet,
	selectedNetwork,
}: {
	input: IUtxo;
	selectedWallet?: string;
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
		updateBitcoinTransaction({
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
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addTxInput = ({
	input,
	selectedWallet,
	selectedNetwork,
}: {
	input: IUtxo;
	selectedWallet?: string;
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
		updateBitcoinTransaction({
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
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const addTxTag = ({
	tag,
	selectedWallet,
	selectedNetwork,
}: {
	tag: string;
	selectedWallet?: string;
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

		let tags = [...(txData.value?.tags ?? []), tag];
		tags = [...new Set(tags)]; // remove duplicates

		updateBitcoinTransaction({
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
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const removeTxTag = ({
	tag,
	selectedWallet,
	selectedNetwork,
}: {
	tag: string;
	selectedWallet?: string;
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

		const tags = txData.value?.tags ?? [];
		const newTags = tags.filter((t) => t !== tag);

		updateBitcoinTransaction({
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

export const setupFeeForOnChainTransaction = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
} = {}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const fees = getStore().fees.onchain;

		const res = updateFee({
			selectedNetwork,
			selectedWallet,
			satsPerByte: fees[EFeeIds.normal],
			selectedFeeId: EFeeIds.normal,
		});

		if (res.isErr()) {
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
 * @param {TAvailableNetworks} selectedNetwork
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
 * @param {string} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {TAddressType} addressType
 */
export const setZeroIndexAddresses = async ({
	selectedWallet,
	selectedNetwork,
	addressType,
	addressIndexInfo,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
	addressType?: TAddressType;
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

	if (
		addressIndexInfo.addressIndex.index >= 0 &&
		addressIndexInfo.changeAddressIndex.index >= 0
	) {
		return ok('No need to set indexes.');
	}

	let addressIndex = addressIndexInfo.addressIndex;
	let changeAddressIndex = addressIndexInfo.changeAddressIndex;

	let payload: {
		addressIndex?: IAddressContent;
		changeAddressIndex?: IAddressContent;
	} = {};

	if (addressIndex.index < 0) {
		const addresses: IAddress =
			getStore().wallet.wallets[selectedWallet].addresses[selectedNetwork][
				addressType
			];
		const filterRes = Object.values(addresses).filter((a) => a.index === 0);
		if (filterRes.length) {
			payload.addressIndex = filterRes[0];
		}
	}
	if (changeAddressIndex.index < 0) {
		const changeAddresses: IAddress =
			getStore().wallet.wallets[selectedWallet].changeAddresses[
				selectedNetwork
			][addressType];
		const filterRes = Object.values(changeAddresses).filter(
			(a) => a.index === 0,
		);
		if (filterRes.length) {
			payload.changeAddressIndex = filterRes[0];
		}
	}

	await dispatch({
		type: actions.UPDATE_ADDRESS_INDEX,
		payload: {
			...payload,
			addressType,
		},
	});
	return ok('Set Zero Index Addresses.');
};
