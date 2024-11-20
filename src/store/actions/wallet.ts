import { AppState } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import cloneDeep from 'lodash/cloneDeep';
import {
	EAddressType,
	EAvailableNetworks,
	EBoostType,
	EFeeId,
	getDefaultWalletData,
	getStorageKeyValues,
	IAddress,
	IBoostedTransaction,
	IFormattedTransactions,
	IKeyDerivationPath,
	IOutput,
	ISendTransaction,
	IUtxo,
	IWalletData,
	TSetupTransactionResponse,
} from 'beignet';

import { ICreateWallet, TWalletName } from '../types/wallet';
import {
	blockHeightToConfirmations,
	createDefaultWallet,
	getCurrentWallet,
	getOnChainWallet,
	getOnChainWalletAsync,
	getOnChainWalletTransaction,
	getOnChainWalletTransactionAsync,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
} from '../../utils/wallet';
import {
	dispatch,
	getFeesStore,
	getSettingsStore,
	getWalletStore,
} from '../helpers';
import { EAvailableNetwork } from '../../utils/networks';
import { removeKeyFromObject, sleep } from '../../utils/helpers';
import { TGetImpactedAddressesRes } from '../types/checks';
import { updateActivityList } from '../utils/activity';
import { ETransactionSpeed } from '../types/settings';
import { updateOnchainFeeEstimates } from '../utils/fees';
import { getMaxSendAmount, updateFee } from '../../utils/wallet/transactions';
import { getExchangeRates, IExchangeRates } from '../../utils/exchange-rate';
import {
	addUnconfirmedTransactions,
	createWallet,
	replaceImpactedAddresses,
	setWalletExits,
	updateHeader,
	updateTransactions,
	updateWallet,
	updateWalletData,
} from '../slices/wallet';

/**
 * Creates and stores a newly specified wallet.
 * @param {string} mnemonic
 * @param {string} [wallet]
 * @param {string} [bip39Passphrase]
 * @param {EAddressType[]} [addressTypesToCreate]
 * @return {Promise<Result<string>>}
 */
export const createWalletThunk = async ({
	walletName = 'wallet0',
	mnemonic,
	bip39Passphrase = '',
	restore = false,
	addressTypesToCreate,
	selectedNetwork = getSelectedNetwork(),
	servers,
}: ICreateWallet): Promise<Result<string>> => {
	try {
		if (!addressTypesToCreate && restore) {
			// If restoring a wallet, create and monitor all address types
			addressTypesToCreate = Object.values(EAddressType);
			dispatch(
				updateWallet({ addressTypesToMonitor: Object.values(EAddressType) }),
			);
		}
		const response = await createDefaultWallet({
			walletName,
			mnemonic,
			bip39Passphrase,
			restore,
			addressTypesToCreate,
			selectedNetwork,
			servers,
		});
		if (response.isErr()) {
			return err(response.error.message);
		}
		dispatch(createWallet(response.value));
		await sleep(1000); // give Beignet some time to propagate the data
		dispatch(setWalletExits());
		return ok('');
	} catch (e) {
		return err(e);
	}
};

export const updateExchangeRates = async (
	exchangeRates?: IExchangeRates,
): Promise<Result<string>> => {
	if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
		const res = await getExchangeRates();
		if (res.isErr()) {
			return err(res.error);
		}
		exchangeRates = res.value;
	}

	dispatch(updateWallet({ exchangeRates }));

	return ok('Successfully updated the exchange rate.');
};

export const generateNewReceiveAddress = async ({
	addressType,
	keyDerivationPath,
}: {
	addressType?: EAddressType;
	keyDerivationPath?: IKeyDerivationPath;
}): Promise<Result<IAddress>> => {
	try {
		const wallet = await getOnChainWalletAsync();
		return wallet.generateNewReceiveAddress({ addressType, keyDerivationPath });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Clears the UTXO array and balance.
 * @returns {Promise<string>}
 */
export const clearUtxos = async (): Promise<string> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.clearUtxos();
};

/**
 * Parses and adds unconfirmed transactions to the store.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {IFormattedTransactions} transactions
 * @returns {Result<string>}
 */
export const addUnconfirmedTransactionsThunk = (
	transactions: IFormattedTransactions,
): Result<string> => {
	try {
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

		dispatch(addUnconfirmedTransactions(unconfirmedTransactions));
		return ok('Successfully updated unconfirmed transactions.');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * FOR TESTING PURPOSES ONLY. DO NOT USE.
 * Injects a fake transaction into the store for testing.
 * @param {IFormattedTransactions} [fakeTx]
 */
export const injectFakeTransaction = (
	fakeTx: IFormattedTransactions,
): Result<string> => {
	dispatch(updateTransactions(fakeTx));
	addUnconfirmedTransactionsThunk(fakeTx);
	updateActivityList();

	return ok('Successfully injected fake transactions.');
};

// /**
// CURRENTLY UNUSED
//  * Retrieves, formats & stores the transaction history for the selected wallet/network.
//  * @param {boolean} [scanAllAddresses]
//  * @param {boolean} [replaceStoredTransactions] Setting this to true will set scanAllAddresses to true as well.
//  */
// export const updateTransactions = async ({
// 	scanAllAddresses = false,
// 	replaceStoredTransactions = false,
// }: {
// 	scanAllAddresses?: boolean;
// 	replaceStoredTransactions?: boolean;
// }): Promise<Result<string | undefined>> => {
// 	const wallet = async getOnChainWalletAsync();
// 	return await wallet.updateTransactions({
// 		scanAllAddresses,
// 		replaceStoredTransactions,
// 	});
// };

/**
 * Deletes a given on-chain trnsaction by id.
 * @param {string} txid
 * @returns {Promise<void>}
 */
export const deleteOnChainTransactionById = async ({
	txid,
}: {
	txid: string;
}): Promise<void> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.deleteOnChainTransactionById({ txid });
};

/**
 * Adds a boosted transaction id to the boostedTransactions object.
 * @param {string} newTxId
 * @param {string} oldTxId
 * @param {EBoostType} [type]
 * @param {number} fee
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
	const wallet = await getOnChainWalletAsync();
	return await wallet.addBoostedTransaction({
		newTxId,
		oldTxId,
		type,
		fee,
	});
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
	rbf,
	satsPerByte,
	outputs,
}: {
	//addressType?: EAddressType; // Preferred address type for change address.
	inputTxHashes?: string[]; // Used to pre-specify inputs to use by tx_hash
	utxos?: IUtxo[]; // Used to pre-specify utxos to use
	rbf?: boolean; // Enable or disable rbf.
	satsPerByte?: number; // Set the sats per byte for the transaction.
	outputs?: IOutput[]; // Used to pre-specify outputs to use.
} = {}): Promise<TSetupTransactionResponse> => {
	rbf = rbf ?? getSettingsStore().rbf;
	const transaction = await getOnChainWalletTransactionAsync();
	return await transaction.setupTransaction({
		inputTxHashes,
		utxos,
		rbf,
		satsPerByte,
		outputs,
	});
};

/**
 * Retrieves the next available change address data.
 * @param {EAddressType} [addressType]
 * @returns {Promise<Result<IAddress>>}
 */
export const getChangeAddress = async ({
	addressType,
}: {
	addressType?: EAddressType;
}): Promise<Result<IAddress>> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.getChangeAddress(addressType);
};

/**
 * This updates the transaction state used for sending.
 * @param {Partial<ISendTransaction>} transaction
 * @returns {Promise<Result<string>>}
 */
export const updateSendTransaction = (
	transaction: Partial<ISendTransaction>,
): Result<string> => {
	const tx = getOnChainWalletTransaction();
	return tx.updateSendTransaction({ transaction });
};

/**
 * This completely resets the send transaction state for the specified wallet and network.
 * @returns {Result<string>}
 */
export const resetSendTransaction = async (): Promise<Result<string>> => {
	const transaction = await getOnChainWalletTransactionAsync();
	return transaction.resetSendTransaction();
};

export const updateSelectedAddressType = async ({
	addressType,
}: {
	addressType: EAddressType;
}): Promise<void> => {
	const wallet = await getOnChainWalletAsync();
	const addressTypesToMonitor = wallet.addressTypesToMonitor;
	if (!addressTypesToMonitor.includes(addressType)) {
		// Append the new address type so we monitor it in subsequent sessions.
		addressTypesToMonitor.push(addressType);
	}
	dispatch(updateWallet({ addressTypesToMonitor }));
	return await wallet.updateAddressType(addressType);
};

/**
 * Removes the specified input from the current transaction.
 * @param {IUtxo} input
 * @returns {Result<IUtxo[]>}
 */
export const removeTxInput = ({ input }: { input: IUtxo }): Result<IUtxo[]> => {
	const wallet = getOnChainWallet();
	const removeRes = wallet.removeTxInput({
		input,
	});
	if (removeRes.isErr()) {
		return err(removeRes.error.message);
	}
	const newInputs = removeRes.value;
	const transaction = wallet.transaction;
	if (transaction.data.max) {
		const maxRes = getMaxSendAmount({
			transaction: {
				...transaction.data,
				inputs: newInputs,
			},
		});
		if (maxRes.isErr()) {
			return err(maxRes.error.message);
		}
		const currentOutput = transaction.data.outputs[0];
		transaction.updateSendTransaction({
			transaction: {
				...transaction.data,
				inputs: newInputs,
				outputs: [{ ...currentOutput, value: maxRes.value.amount }],
				fee: maxRes.value.fee,
			},
		});
	}
	return removeRes;
};

/**
 * Adds a specified input to the current transaction.
 * @param {IUtxo} input
 * @returns {Result<IUtxo[]>}
 */
export const addTxInput = ({ input }: { input: IUtxo }): Result<IUtxo[]> => {
	const wallet = getOnChainWallet();
	const addRes = wallet.addTxInput({
		input,
	});
	if (addRes.isErr()) {
		return err(addRes.error.message);
	}
	const newInputs = addRes.value;
	const transaction = wallet.transaction;
	if (transaction.data.max) {
		const maxRes = getMaxSendAmount({
			transaction: {
				...transaction.data,
				inputs: newInputs,
			},
		});
		if (maxRes.isErr()) {
			return err(maxRes.error.message);
		}
		const currentOutput = transaction.data.outputs[0];
		transaction.updateSendTransaction({
			transaction: {
				...transaction.data,
				inputs: newInputs,
				outputs: [{ ...currentOutput, value: maxRes.value.amount }],
				fee: maxRes.value.fee,
			},
		});
	}
	return addRes;
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
	const selectedFeeId =
		transaction.selectedFeeId === 'none'
			? txSpeedToFeeId(getSettingsStore().transactionSpeed)
			: transaction.selectedFeeId;
	let satsPerByte =
		transaction.selectedFeeId === 'none'
			? preferredFeeRate
			: transaction.satsPerByte;
	const feeSetupRes = wallet.setupFeeForOnChainTransaction({
		satsPerByte,
		selectedFeeId,
	});
	if (feeSetupRes.isOk()) {
		return feeSetupRes;
	}

	// If unable to set up fee using the selectedFeeId set maxSatPerByte from getFeeInfo.
	const txFeeInfo = wallet.getFeeInfo({
		satsPerByte,
		transaction,
	});
	if (txFeeInfo.isErr()) {
		return err(txFeeInfo.error.message);
	}
	if (txFeeInfo.value.maxSatPerByte < satsPerByte) {
		satsPerByte = txFeeInfo.value.maxSatPerByte;
	}
	const updateRes = updateFee({ satsPerByte, transaction });
	if (updateRes.isErr()) {
		return err(feeSetupRes.error.message);
	}
	return ok('Successfully set up fee for on-chain transaction');
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
 * Used to update/replace mismatched addresses.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TGetImpactedAddressesRes} impactedAddresses
 * @returns {Promise<Result<string>>}
 */
export const replaceImpactedAddressesThunk = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	impactedAddresses,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	impactedAddresses: TGetImpactedAddressesRes; // Retrieved from getImpactedAddresses
}): Result<string> => {
	try {
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

		dispatch(
			replaceImpactedAddresses({
				newAddresses,
				newAddressIndex,
				newChangeAddresses,
				newChangeAddressIndex,
			}),
		);

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
		if (!(selectedWallet in getWalletStore().wallets)) {
			return err('Unable to locate wallet data.');
		}
		if (keyValue === 'feeEstimates') {
			// @ts-ignore
			return ok(getFeesStore().onchain);
		}
		const wallet = getWalletStore().wallets[selectedWallet];
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
		const data2 = cloneDeep(data);
		switch (value) {
			case 'header': {
				const header = data2 as IWalletData[typeof value];
				const selectedNetwork = getNetworkFromBeignet(network);
				dispatch(updateHeader({ header, selectedNetwork }));

				const appState = AppState.currentState;
				const appInBackground = ['background', 'inactive'].includes(appState);

				// If the app is in the background, refreshing will fail.
				if (!appInBackground) {
					// Make sure transactions are updated after a new block is received.
					await refreshWallet({ lightning: false });
				}
				break;
			}
			case 'feeEstimates': {
				const feeEstimates = data2 as IWalletData[typeof value];
				updateOnchainFeeEstimates({
					selectedNetwork: getNetworkFromBeignet(network),
					feeEstimates,
					forceUpdate: true,
				});
				break;
			}
			case 'selectedFeeId': {
				break;
			}
			default: {
				const walletData = data2 as IWalletData[typeof value];
				dispatch(
					updateWalletData({
						selectedWallet: walletName,
						network: getNetworkFromBeignet(network),
						key: value,
						data: walletData,
					}),
				);
			}
		}

		return ok(true);
	} catch (e) {
		console.error('Error in setWalletData:', e);
		return err(e);
	}
};

export const getNetworkFromBeignet = (
	network: EAvailableNetworks,
): EAvailableNetwork => {
	switch (network) {
		case EAvailableNetworks.bitcoin:
		case EAvailableNetworks.bitcoinMainnet:
			return EAvailableNetwork.bitcoin;
		case EAvailableNetworks.testnet:
		case EAvailableNetworks.bitcoinTestnet:
			return EAvailableNetwork.bitcoinTestnet;
		case EAvailableNetworks.regtest:
		case EAvailableNetworks.bitcoinRegtest:
			return EAvailableNetwork.bitcoinRegtest;
	}
};

export const getNetworkForBeignet = (
	network: EAvailableNetwork,
): EAvailableNetworks => {
	switch (network) {
		case EAvailableNetwork.bitcoin:
			return EAvailableNetworks.bitcoin;
		case EAvailableNetwork.bitcoinTestnet:
			return EAvailableNetworks.bitcoinTestnet;
		case EAvailableNetwork.bitcoinRegtest:
			return EAvailableNetworks.bitcoinRegtest;
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
