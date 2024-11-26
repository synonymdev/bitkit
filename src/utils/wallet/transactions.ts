import { err, ok, Result } from '@synonymdev/result';
import {
	EAddressType,
	EBoostType,
	EFeeId,
	getByteCount,
	ICanBoostResponse,
	IOnchainFees,
	IOutput,
	ISendTransaction,
	IUtxo,
} from 'beignet';
import { getAddressInfo } from 'bitcoin-address-validation';

import { __E2E__ } from '../../constants/env';
import {
	addBoostedTransaction,
	updateSendTransaction,
} from '../../store/actions/wallet';
import {
	dispatch,
	getFeesStore,
	getSettingsStore,
	getUiStore,
} from '../../store/helpers';
import { removeActivityItem } from '../../store/slices/activity';
import { initialFeesState } from '../../store/slices/fees';
import { requireBackup } from '../../store/slices/backup';
import { TWalletName } from '../../store/types/wallet';
import { EBackupCategory } from '../../store/utils/backup';
import {
	ETransactionSpeed,
	TCoinSelectPreference,
} from '../../store/types/settings';
import { reduceValue } from '../helpers';
import i18n from '../i18n';
import { EAvailableNetwork } from '../networks';
import { showToast } from '../notifications';
import { TRANSACTION_DEFAULTS } from './constants';
import {
	getBalance,
	getOnChainWallet,
	getOnChainWalletAsync,
	getOnChainWalletElectrum,
	getOnChainWalletTransaction,
	getOnChainWalletTransactionAsync,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
} from './index';

/*
 * Attempt to estimate the current fee for a given wallet and its UTXO's
 */
export const getTotalFee = ({
	satsPerByte,
	message = '',
	transaction, // If left undefined, the method will retrieve the tx data from state.
	fundingLightning = false,
}: {
	satsPerByte: number;
	message?: string;
	transaction?: Partial<ISendTransaction>;
	fundingLightning?: boolean;
}): number => {
	const wallet = getOnChainWallet();
	return wallet.transaction.getTotalFee({
		satsPerByte,
		message,
		transaction,
		fundingLightning,
	});
};

/**
 * Creates complete signed transaction using the transaction data store
 * @param {ISendTransaction} [transactionData]
 * @returns {Promise<Result<{id: string, hex: string}>>}
 */
export const createTransaction = async (
	transactionData?: ISendTransaction,
): Promise<Result<{ id: string; hex: string }>> => {
	try {
		const transaction = await getOnChainWalletTransactionAsync();
		const createTxRes = await transaction.createTransaction({
			transactionData,
		});
		if (createTxRes.isErr()) {
			showToast({
				type: 'warning',
				title: i18n.t('wallet:error_create_tx'),
				description: i18n.t('wallet:error_create_tx_msg', {
					raw: createTxRes.error.message,
				}),
			});
			return err(createTxRes.error.message);
		}
		return ok(createTxRes.value);
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns onchain transaction data related to the specified network and wallet.
 * @returns {ISendTransaction}
 */
export const getOnchainTransactionData = (): ISendTransaction => {
	return getOnChainWalletTransaction().data;
};

export const broadcastTransaction = async ({
	rawTx,
	subscribeToOutputAddress = true,
}: {
	rawTx: string;
	subscribeToOutputAddress?: boolean;
}): Promise<Result<string>> => {
	const electrum = getOnChainWalletElectrum();
	return await electrum.broadcastTransaction({
		rawTx,
		subscribeToOutputAddress,
	});
};

/**
 * Returns total value of all outputs. Excludes any value that would be sent to the change address.
 * @param {IOutput[]} [outputs]
 * @returns {number}
 */
export const getTransactionOutputValue = ({
	outputs,
}: {
	outputs?: IOutput[];
} = {}): number => {
	try {
		if (!outputs) {
			outputs = getOnchainTransactionData().outputs;
		}
		const response = reduceValue(outputs, 'value');
		if (response.isOk()) {
			return response.value;
		}
		return 0;
	} catch (e) {
		console.log(e);
		return 0;
	}
};

/**
 * Returns total value of all utxos.
 * @param {IUtxo[]} [inputs]
 */
export const getTransactionInputValue = ({
	inputs,
}: {
	inputs?: IUtxo[];
}): number => {
	try {
		if (!inputs) {
			inputs = getOnchainTransactionData().inputs;
		}
		if (inputs) {
			const response = reduceValue(inputs, 'value');
			if (response.isOk()) {
				return response.value;
			}
		}
		return 0;
	} catch (e) {
		return 0;
	}
};

/**
 * Updates the fee for the current transaction by the specified amount.
 * @param {number} [satsPerByte]
 * @param {EFeeId} [selectedFeeId]
 * @param {number} [index]
 * @param {ISendTransaction} [transaction]
 */
export const updateFee = ({
	satsPerByte,
	selectedFeeId = EFeeId.custom,
	index = 0,
	transaction,
}: {
	satsPerByte: number;
	selectedFeeId?: EFeeId;
	index?: number;
	transaction?: ISendTransaction;
}): Result<{ fee: number }> => {
	const tx = getOnChainWalletTransaction();
	return tx.updateFee({
		satsPerByte,
		index,
		transaction,
		selectedFeeId,
	});
};

/**
 * Returns a block explorer URL for a specific transaction
 * @param {string} id
 * @param {'tx' | 'address'} type
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {'blockstream' | 'mempool'} [service]
 */
export const getBlockExplorerLink = (
	id: string,
	type: 'tx' | 'address' = 'tx',
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
	service: 'blockstream' | 'mempool' = 'mempool',
): string => {
	switch (service) {
		case 'blockstream':
			if (selectedNetwork === 'bitcoinTestnet') {
				return `https://blockstream.info/testnet/${type}/${id}`;
			} else {
				return `https://blockstream.info/${type}/${id}`;
			}
		case 'mempool':
			if (selectedNetwork === 'bitcoinTestnet') {
				return `https://mempool.space/testnet/${type}/${id}`;
			} else {
				return `https://mempool.space/${type}/${id}`;
			}
	}
};

export interface IAddressTypesIO {
	inputs: {
		[key in EAddressType]: number;
	};
	outputs: {
		[key in EAddressType]: number;
	};
}

export interface ICoinSelectResponse {
	fee: number;
	inputs: IUtxo[];
	outputs: IOutput[];
}
// TODO: Migrate to Beignet
export const autoCoinSelect = async ({
	inputs = [],
	outputs = [],
	satsPerByte = 1,
	sortMethod = 'small',
	amountToSend = 0,
}: {
	inputs?: IUtxo[];
	outputs?: IOutput[];
	satsPerByte?: number;
	sortMethod?: TCoinSelectPreference;
	amountToSend?: number;
}): Promise<Result<ICoinSelectResponse>> => {
	try {
		if (!inputs) {
			return err('No inputs provided');
		}
		if (!outputs) {
			return err('No outputs provided');
		}
		if (!amountToSend) {
			//If amountToSend is not specified, attempt to determine how much to send from the output values.
			amountToSend = outputs.reduce((acc, cur) => {
				return acc + Number(cur?.value) || 0;
			}, 0);
		}

		//Sort by the largest UTXO amount (Lowest fee, but reveals your largest UTXO's)
		if (sortMethod === 'large') {
			inputs.sort((a, b) => Number(b.value) - Number(a.value));
		} else {
			//Sort by the smallest UTXO amount (Highest fee, but hides your largest UTXO's)
			inputs.sort((a, b) => Number(a.value) - Number(b.value));
		}

		//Add UTXO's until we have more than the target amount to send.
		let inputAmount = 0;
		let newInputs: IUtxo[] = [];
		let oldInputs: IUtxo[] = [];

		//Consolidate UTXO's if unable to determine the amount to send.
		if (sortMethod === 'consolidate' || !amountToSend) {
			//Add all inputs
			newInputs = [...inputs];
			inputAmount = newInputs.reduce((acc, cur) => {
				return acc + Number(cur.value);
			}, 0);
		} else {
			//Add only the necessary inputs based on the amountToSend.
			await Promise.all(
				inputs.map((input) => {
					if (inputAmount < amountToSend) {
						inputAmount += input.value;
						newInputs.push(input);
					} else {
						oldInputs.push(input);
					}
				}),
			);

			//The provided UTXO's do not have enough to cover the transaction.
			if ((amountToSend && inputAmount < amountToSend) || !newInputs?.length) {
				return err('Not enough funds.');
			}
		}

		// Get all input and output address types for fee calculation.
		let addressTypes = {
			inputs: {},
			outputs: {},
		} as IAddressTypesIO;

		await Promise.all([
			newInputs.map(({ address }) => {
				const validateResponse = getAddressInfo(address);
				if (!validateResponse) {
					return;
				}
				const type = validateResponse.type.toUpperCase();
				if (type in addressTypes.inputs) {
					addressTypes.inputs[type] = addressTypes.inputs[type] + 1;
				} else {
					addressTypes.inputs[type] = 1;
				}
			}),
			outputs.map(({ address }) => {
				if (!address) {
					return;
				}
				const validateResponse = getAddressInfo(address);
				if (!validateResponse) {
					return;
				}
				const type = validateResponse.type.toUpperCase();
				if (type in addressTypes.outputs) {
					addressTypes.outputs[type] = addressTypes.outputs[type] + 1;
				} else {
					addressTypes.outputs[type] = 1;
				}
			}),
		]);

		const baseFee = getByteCount(addressTypes.inputs, addressTypes.outputs);
		const fee = baseFee * satsPerByte;

		//Ensure we can still cover the transaction with the previously selected UTXO's. Add more UTXO's if not.
		const totalTxCost = amountToSend + fee;
		if (amountToSend && inputAmount < totalTxCost) {
			await Promise.all(
				oldInputs.map((input) => {
					if (inputAmount < totalTxCost) {
						inputAmount += input.value;
						newInputs.push(input);
					}
				}),
			);
		}

		//The provided UTXO's do not have enough to cover the transaction.
		if (inputAmount < totalTxCost || !newInputs?.length) {
			return err('Not enough funds');
		}
		return ok({ inputs: newInputs, outputs, fee });
	} catch (e) {
		return err(e);
	}
};

/**
 * Used to determine if we're able to boost a transaction either by RBF or CPFP.
 * @param {string} txid
 */
export const canBoost = (txid: string): ICanBoostResponse => {
	const wallet = getOnChainWallet();
	return wallet.canBoost(txid);
};

// TODO: get actual routing fee (Currently generous with the fee for wiggle room to prevent routing failures)
export const getEstimatedRoutingFee = (amount: number): number => {
	const fee = 100;
	if (amount > fee) {
		return fee;
	} else if (amount > 25) {
		return 25;
	} else if (amount > 10) {
		return 10;
	} else if (amount > 3) {
		return 1;
	} else {
		// Make an attempt to spend it all, but will likely fail without a proper routing fee allotment.
		return 0;
	}
};

/**
 * Calculates the max amount able to send for onchain/lightning
 * @param {ISendTransaction} [transaction]
 * @param {'onchain' | 'lightning'} [method
 */
export const getMaxSendAmount = ({
	transaction,
	method,
}: {
	transaction?: ISendTransaction;
	method?: 'onchain' | 'lightning';
} = {}): Result<{ amount: number; fee: number }> => {
	try {
		if (!transaction) {
			transaction = getOnchainTransactionData();
		}

		const defaultMethod = transaction.lightningInvoice
			? 'lightning'
			: 'onchain';
		method = method ?? defaultMethod;

		if (method === 'lightning') {
			// lightning transaction
			const { spendingBalance } = getBalance();
			const fee = getEstimatedRoutingFee(spendingBalance);
			const amount = spendingBalance - fee;
			const maxAmount = { amount, fee };
			return ok(maxAmount);
		} else {
			const wallet = getOnChainWallet();
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

			return wallet.transaction.getMaxSendAmount({
				satsPerByte,
				selectedFeeId,
				transaction,
			});
		}
	} catch (e) {
		return err(e);
	}
};

/**
 * Sends the max amount to the provided output index.
 * @param {string} [address] If left undefined, the current receiving address will be provided.
 * @param {ISendTransaction} [transaction]
 * @param {number} [index]
 */
export const sendMax = async ({
	address,
	index = 0,
}: {
	address?: string;
	index?: number;
} = {}): Promise<Result<string>> => {
	const { paymentMethod } = getUiStore();

	try {
		const tx = await getOnChainWalletTransactionAsync();
		const transaction = tx.data;

		// TODO: Re-work lightning transaction invoices once beignet migration is complete.
		// Handle max toggle for lightning invoice
		if (paymentMethod === 'lightning') {
			const { spendingBalance } = getBalance();

			const fee = getEstimatedRoutingFee(spendingBalance);
			const amount = spendingBalance - fee;

			const outputs = transaction.outputs ?? [];
			// No address specified, attempt to assign the address currently specified in the current output index.
			if (!address) {
				address = outputs[index]?.address ?? '';
			}
			tx.updateSendTransaction({
				transaction: {
					max: true,
					outputs: [{ address, value: amount, index }],
					fee,
				},
			});
			return ok('Updated lightning transaction.');
		}

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
		const _transaction = {
			...tx.data,
			...transaction,
		};
		return await tx.sendMax({
			address,
			transaction: _transaction,
			index,
			satsPerByte,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Adjusts the fee by a given sat per byte.
 * @param {number} [adjustBy]
 * @param {ISendTransaction} [transaction]
 */
export const adjustFee = ({
	adjustBy,
	transaction,
}: {
	adjustBy: number;
	transaction?: ISendTransaction;
}): Result<{ fee: number }> => {
	try {
		if (!transaction) {
			transaction = getOnchainTransactionData();
		}
		// const coinSelectPreference = getStore().settings.coinSelectPreference;
		const newSatsPerByte = transaction.satsPerByte + adjustBy;
		if (newSatsPerByte < 1) {
			return err(i18n.t('wallet:send_fee_error_min'));
		}
		const response = updateFee({
			transaction,
			satsPerByte: newSatsPerByte,
		});
		// TODO: Enable runCoinSelect.
		// if (address && coinSelectPreference !== 'consolidate') {
		// 	runCoinSelect({ selectedWallet, selectedNetwork });
		// }
		return response;
	} catch (e) {
		return err(e);
	}
};

/**
 * Updates the amount to send for the currently selected output.
 * @param {number} amount
 * @param {ISendTransaction} [transaction]
 */
export const updateSendAmount = ({
	amount,
	transaction,
}: {
	amount: number;
	transaction?: ISendTransaction;
}): Result<string> => {
	const { paymentMethod } = getUiStore();

	if (!transaction) {
		transaction = getOnchainTransactionData();
	}

	// TODO: add support for multiple outputs
	const currentOutput = transaction.outputs[0];
	let max = false;

	if (paymentMethod === 'lightning') {
		// lightning transaction
		const { spendingBalance } = getBalance();

		if (amount > spendingBalance) {
			return err(i18n.t('wallet:send_amount_error_balance'));
		}

		if (amount === spendingBalance) {
			max = true;
		}
	} else {
		// onchain transaction
		const inputTotal = getTransactionInputValue({
			inputs: transaction.inputs,
		});

		const totalAmount = amount + transaction.fee;

		if (totalAmount === inputTotal) {
			max = true;
		} else {
			if (amount > inputTotal) {
				return err(i18n.t('wallet:send_amount_error_balance'));
			}

			if (totalAmount > inputTotal) {
				return err(i18n.t('wallet:send_amount_error_fee'));
			}

			if (totalAmount > inputTotal - TRANSACTION_DEFAULTS.dustLimit) {
				// TODO: add dust to fee
				console.log('Transaction will create dust. Adding dust to fee.');
			}
		}
	}

	if (currentOutput && amount === currentOutput.value) {
		return ok('No change detected. No need to update.');
	}

	updateSendTransaction({
		outputs: [{ ...currentOutput, value: amount }],
		max,
	});

	return ok('');
};

/**
 * Updates the OP_RETURN message.
 * CURRENTLY UNUSED
 * // TODO: Migrate to Beignet
 * @param {string} message
 * @param {ISendTransaction} [transaction]
 * @param {number} [index]
 */
export const updateMessage = async ({
	message,
	transaction,
	index = 0,
}: {
	message: string;
	transaction?: ISendTransaction;
	index?: number;
}): Promise<Result<string>> => {
	if (!transaction) {
		transaction = getOnchainTransactionData();
	}
	const { max, satsPerByte, outputs, inputs } = transaction;
	const newFee = getTotalFee({ satsPerByte, message });
	const inputTotal = getTransactionInputValue({ inputs });
	const outputTotal = getTransactionOutputValue({ outputs });
	const totalNewAmount = outputTotal + newFee;
	let address = '';
	if (outputs.length > index) {
		address = outputs[index].address ?? '';
	}
	const _transaction: Partial<ISendTransaction> = {
		message,
		fee: newFee,
	};
	if (max) {
		_transaction.outputs = [{ address, value: inputTotal - newFee, index }];
		//Update the tx value with the new fee to continue sending the max amount.
		updateSendTransaction(_transaction);
		return ok('Successfully updated the message.');
	}
	if (totalNewAmount <= inputTotal) {
		updateSendTransaction(_transaction);
	}
	return ok('Successfully updated the message.');
};

/**
 * Runs & Applies the autoCoinSelect method to the current transaction.
 * @param {ISendTransaction} [transaction]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
//TODO: Uncomment and utilize the following runCoinSelect method once the send flow is complete.
/*
const runCoinSelect = async ({
	transaction,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	transaction?: ISendTransaction;
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
}): Promise<Result<string>> => {
	try {
		if (!transaction) {
			const transactionDataResponse = getOnchainTransactionData({
				selectedWallet,
				selectedNetwork,
			});
			if (transactionDataResponse.isErr()) {
				return err(transactionDataResponse.error.message);
			}
			transaction = transactionDataResponse.value;
		}
		const coinSelectPreference = getStore().settings.coinSelectPreference;
		//const inputs = transaction.inputs;
		const utxos: IUtxo[] =
			getStore().wallet.wallets[selectedWallet].utxos[selectedNetwork];
		const outputs = transaction.outputs;
		const amountToSend = getTransactionOutputValue({
			selectedNetwork,
			selectedWallet,
			outputs,
		});
		const newSatsPerByte = transaction.satsPerByte;
		const autoCoinSelectResponse = await autoCoinSelect({
			amountToSend,
			inputs: utxos,
			outputs,
			satsPerByte: newSatsPerByte,
			sortMethod: coinSelectPreference,
		});
		if (autoCoinSelectResponse.isErr()) {
			return err(autoCoinSelectResponse.error.message);
		}
		if (
			transaction?.inputs?.length !== autoCoinSelectResponse.value.inputs.length
		) {
			const updatedTx: ISendTransaction = {
				fee: autoCoinSelectResponse.value.fee,
				inputs: autoCoinSelectResponse.value.inputs,
			};
			updateSendTransaction(updatedTx);
			return ok('Successfully updated tx.');
		}
		return ok('No need to update transaction.');
	} catch (e) {
		return err(e);
	}
};
*/

/**
 *
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} txid
 */
export const setupBoost = async ({
	txid,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<Partial<ISendTransaction>>> => {
	// Ensure all utxos are up-to-date if attempting to boost immediately after a transaction.
	const refreshResponse = await refreshWallet({
		onchain: true,
		lightning: false,
		selectedWallet,
		selectedNetwork,
	});
	if (refreshResponse.isErr()) {
		return err(refreshResponse.error.message);
	}
	const canBoostResponse = canBoost(txid);
	if (!canBoostResponse.canBoost) {
		return err('Unable to boost this transaction.');
	}
	if (canBoostResponse.rbf) {
		const rbf = await setupRbf({ txid });
		if (rbf.isOk()) {
			return rbf;
		}
	}
	// fallback to CPFP
	return await setupCpfp({ txid });
};

/**
 * Sets up a CPFP transaction.
 * @param {string} [txid]
 */
export const setupCpfp = async ({
	txid,
}: {
	txid: string;
}): Promise<Result<ISendTransaction>> => {
	const transaction = await getOnChainWalletTransactionAsync();
	return await transaction.setupCpfp({ txid });
};

/**
 * Sets up a transaction for RBF.
 * @param {string} txid
 */
export const setupRbf = async ({
	txid,
}: {
	txid: string;
}): Promise<Result<ISendTransaction>> => {
	const transaction = await getOnChainWalletTransactionAsync();
	return await transaction.setupRbf({ txid });
};

/**
 * Used to broadcast and update a boosted transaction as needed.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} oldTxId
 */
export const broadcastBoost = async ({
	oldTxId,
}: {
	oldTxId: string;
}): Promise<Result<String>> => {
	try {
		const transaction = getOnchainTransactionData();
		const rawTx = await createTransaction();
		if (rawTx.isErr()) {
			return err(rawTx.error.message);
		}

		const broadcastResult = await broadcastTransaction({
			rawTx: rawTx.value.hex,
			subscribeToOutputAddress: false,
		});
		if (broadcastResult.isErr()) {
			return err(broadcastResult.error.message);
		}
		const newTxId = broadcastResult.value;
		const addBoost = await addBoostedTransaction({
			newTxId,
			oldTxId,
			type: transaction.boostType,
			fee: transaction.fee,
		});
		if (addBoost.isErr()) {
			return err(addBoost.error.message);
		}

		dispatch(requireBackup(EBackupCategory.wallet));

		// Only delete the old ActivityItem if it was an RBF
		if (transaction.boostType === EBoostType.rbf) {
			dispatch(removeActivityItem(oldTxId));
		}

		await refreshWallet();
		return ok('Successfully broadcasted boosted transaction.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the current fee estimates for the provided network.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<IOnchainFees>}
 */
export const getFeeEstimates = async (
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
): Promise<Result<IOnchainFees>> => {
	try {
		if (__E2E__) {
			return ok({
				...initialFeesState.onchain,
				timestamp: Date.now(),
			});
		}

		if (selectedNetwork === EAvailableNetwork.bitcoinRegtest) {
			return ok({
				...initialFeesState.onchain,
				timestamp: Date.now(),
			});
		}

		const wallet = await getOnChainWalletAsync();
		const feeRes = await wallet.getFeeEstimates();
		if (!feeRes) {
			return err('Unable to get fee estimates.');
		}
		return ok(feeRes);
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the currently selected on-chain fee id (Ex: 'normal').
 * @returns {EFeeId}
 */
export const getSelectedFeeId = (): EFeeId => {
	const { selectedFeeId } = getOnchainTransactionData();
	return selectedFeeId;
};

/**
 * Returns the amount of sats to send to a given output address in the transaction object by its index.
 * // TODO: Migrate to Beignet
 * @param outputIndex
 * @returns {Result<number>}
 */
export const getTransactionOutputAmount = ({
	outputIndex = 0,
}: {
	outputIndex?: number;
}): Result<number> => {
	const transaction = getOnchainTransactionData();
	if (
		transaction.outputs.length &&
		transaction.outputs.length >= outputIndex + 1 &&
		transaction.outputs[outputIndex].value
	) {
		return ok(transaction.outputs[outputIndex]?.value ?? 0);
	}
	return ok(0);
};
