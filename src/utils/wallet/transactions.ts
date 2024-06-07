import { err, ok, Result } from '@synonymdev/result';
import validate, { getAddressInfo } from 'bitcoin-address-validation';

import { __E2E__ } from '../../constants/env';
import { EAvailableNetwork } from '../networks';
import { reduceValue } from '../helpers';
import { btcToSats } from '../conversion';
import { TWalletName } from '../../store/types/wallet';
import {
	getBalance,
	getCurrentWallet,
	getOnChainBalance,
	getOnChainWallet,
	getOnChainWalletElectrum,
	getOnChainWalletTransaction,
	getRbfData,
	getSelectedNetwork,
	getSelectedWallet,
	getTransactionById,
	refreshWallet,
} from './index';
import {
	getFeesStore,
	getSettingsStore,
	getWalletStore,
} from '../../store/helpers';
import {
	addBoostedTransaction,
	deleteOnChainTransactionById,
	setupOnChainTransaction,
	updateSendTransaction,
} from '../../store/actions/wallet';
import {
	ETransactionSpeed,
	TCoinSelectPreference,
} from '../../store/types/settings';
import { showToast } from '../notifications';
import { TOnchainActivityItem } from '../../store/types/activity';
import { initialFeesState } from '../../store/slices/fees';
import { TRANSACTION_DEFAULTS } from './constants';
import i18n from '../i18n';
import {
	EAddressType,
	EBoostType,
	EFeeId,
	EPaymentType,
	getByteCount,
	IOnchainFees,
	IOutput,
	ISendTransaction,
	IUtxo,
	TGetByteCountInputs,
	TGetByteCountOutputs,
} from 'beignet';

/**
 * Constructs the parameter for getByteCount via an array of addresses.
 * @param {string[]} addresses
 */
export const constructByteCountParam = (
	addresses: string[],
): TGetByteCountInputs | TGetByteCountOutputs => {
	try {
		if (addresses.length <= 0) {
			return { P2WPKH: 0 };
		}
		let param: TGetByteCountOutputs = {};
		addresses.map((address) => {
			if (validate(address)) {
				const addressType = getAddressInfo(address).type.toUpperCase();
				param[addressType] = param[addressType] ? param[addressType] + 1 : 1;
			}
		});
		return param;
	} catch {
		return { P2WPKH: 0 };
	}
};

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
	const baseTransactionSize = TRANSACTION_DEFAULTS.recommendedBaseFee;
	try {
		if (!transaction) {
			const txDataResponse = getOnchainTransactionData();
			if (txDataResponse.isErr()) {
				// If error, return minimum fallback fee.
				return baseTransactionSize * satsPerByte;
			}
			transaction = txDataResponse.value;
		}

		const inputs = transaction.inputs || [];
		const outputs = transaction.outputs || [];
		const changeAddress = transaction.changeAddress;

		//Group all input & output addresses into their respective array.
		const inputAddresses = inputs.map((input) => input.address);
		const outputAddresses = outputs.map((output) => output.address);

		//No need for a change address when draining the wallet
		if (changeAddress && !transaction.max) {
			outputAddresses.push(changeAddress);
		}

		//Determine the address type of each address and construct the object for fee calculation
		const inputParam = constructByteCountParam(inputAddresses);
		const outputParam = constructByteCountParam(outputAddresses);
		//Increase P2WPKH output address by one for lightning funding calculation.
		if (fundingLightning) {
			outputParam.P2WPKH = (outputParam.P2WPKH || 0) + 1;
		}

		const transactionByteCount = getByteCount(inputParam, outputParam, message);
		return transactionByteCount * satsPerByte;
	} catch {
		return baseTransactionSize * satsPerByte;
	}
};

interface ICreateTransaction {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	transactionData?: ISendTransaction;
}

/**
 * Creates complete signed transaction using the transaction data store
 * @param {ISendTransaction} [transactionData]
 * @returns {Promise<Result<{id: string, hex: string}>>}
 */
export const createTransaction = async ({
	transactionData,
}: ICreateTransaction = {}): Promise<Result<{ id: string; hex: string }>> => {
	try {
		const transaction = getOnChainWalletTransaction();
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
 * @returns {Result<ISendTransaction>}
 */
export const getOnchainTransactionData = (): Result<ISendTransaction> => {
	try {
		const transaction = getOnChainWalletTransaction().data;
		if (transaction) {
			return ok(transaction);
		}
		return err('Unable to get transaction data.');
	} catch (e) {
		return err(e);
	}
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
			const transaction = getOnchainTransactionData();
			if (transaction.isErr()) {
				return 0;
			}
			outputs = transaction.value.outputs;
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
			const transaction = getOnchainTransactionData();
			if (transaction.isErr()) {
				return 0;
			}
			inputs = transaction.value.inputs;
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

export interface ICanBoostResponse {
	canBoost: boolean;
	rbf: boolean;
	cpfp: boolean;
}

/**
 * Used to determine if we're able to boost a transaction either by RBF or CPFP.
 * @param {string} txid
 */
export const canBoost = (txid: string): ICanBoostResponse => {
	const failure = { canBoost: false, rbf: false, cpfp: false };
	try {
		const settings = getSettingsStore();
		const rbfEnabled = settings.rbf;
		const transactionResponse = getTransactionById({ txid });
		if (transactionResponse.isErr()) {
			return failure;
		}

		const balance = getOnChainBalance();
		const { currentWallet, selectedNetwork } = getCurrentWallet();

		const hasUtxo = currentWallet.utxos[selectedNetwork].length > 0;

		const { type, matchedOutputValue, totalOutputValue, fee, height } =
			transactionResponse.value;

		// transaction already confirmed
		if (height > 0) {
			return failure;
		}

		/*
		 * For an RBF, technically we can reduce the output value and apply it to the fee,
		 * but this might cause issues when paying a merchant that requested a specific amount.
		 */
		const rbf =
			rbfEnabled &&
			type === EPaymentType.sent &&
			balance >= TRANSACTION_DEFAULTS.recommendedBaseFee &&
			matchedOutputValue !== totalOutputValue &&
			matchedOutputValue > fee &&
			btcToSats(matchedOutputValue) > TRANSACTION_DEFAULTS.recommendedBaseFee;

		// Performing a CPFP tx requires a new tx and higher fee.
		const cpfp =
			hasUtxo &&
			btcToSats(matchedOutputValue) >=
				TRANSACTION_DEFAULTS.recommendedBaseFee * 3;

		return { canBoost: rbf || cpfp, rbf, cpfp };
	} catch (e) {
		return failure;
	}
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @param {number} [index]
 */
export const getMaxSendAmount = ({
	transaction,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	transaction?: ISendTransaction;
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
}): Result<{ amount: number; fee: number }> => {
	try {
		if (!transaction) {
			const transactionDataResponse = getOnchainTransactionData();
			if (transactionDataResponse.isErr()) {
				return err(transactionDataResponse.error.message);
			}
			transaction = transactionDataResponse.value;
		}

		if (transaction.lightningInvoice) {
			// lightning transaction
			const { spendingBalance } = getBalance({
				selectedWallet,
				selectedNetwork,
			});
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	address?: string;
	index?: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string>> => {
	try {
		const tx = getOnChainWalletTransaction();
		const transaction = tx.data;

		// TODO: Re-work lightning transaction invoices once beignet migration is complete.
		// Handle max toggle for lightning invoice
		if (transaction.lightningInvoice) {
			const { spendingBalance } = getBalance({
				selectedWallet,
				selectedNetwork,
			});

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
			const transactionDataResponse = getOnchainTransactionData();
			if (transactionDataResponse.isErr()) {
				return err(transactionDataResponse.error.message);
			}
			transaction = transactionDataResponse.value;
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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const updateSendAmount = ({
	amount,
	transaction,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	amount: number;
	transaction?: ISendTransaction;
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
}): Result<string> => {
	if (!transaction) {
		const transactionDataResponse = getOnchainTransactionData();
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		transaction = transactionDataResponse.value;
	}

	// TODO: add support for multiple outputs
	const currentOutput = transaction.outputs[0];
	let max = false;

	if (transaction.lightningInvoice) {
		// lightning transaction
		const { spendingBalance } = getBalance({
			selectedWallet,
			selectedNetwork,
		});

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
		transaction: {
			outputs: [{ ...currentOutput, value: amount }],
			max,
		},
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
		const transactionDataResponse = getOnchainTransactionData();
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		transaction = transactionDataResponse.value;
	}
	const max = transaction?.max;
	const satsPerByte = transaction?.satsPerByte ?? 1;
	const outputs = transaction?.outputs ?? [];
	const inputs = transaction?.inputs ?? [];

	const newFee = getTotalFee({ satsPerByte, message });
	const inputTotal = getTransactionInputValue({
		inputs,
	});
	const outputTotal = getTransactionOutputValue({
		outputs,
	});
	const totalNewAmount = outputTotal + newFee;
	let address = '';
	if (outputs?.length > index) {
		address = outputs[index].address ?? '';
	}
	const _transaction: Partial<ISendTransaction> = {
		message,
		fee: newFee,
	};
	if (max) {
		_transaction.outputs = [{ address, value: inputTotal - newFee, index }];
		//Update the tx value with the new fee to continue sending the max amount.
		updateSendTransaction({
			transaction: _transaction,
		});
		return ok('Successfully updated the message.');
	}
	if (totalNewAmount <= inputTotal) {
		updateSendTransaction({
			transaction: _transaction,
		});
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
			updateSendTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: updatedTx,
			});
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
		return await setupRbf({ txid });
	} else {
		return await setupCpfp({ txid });
	}
};

/**
 * Sets up a CPFP transaction.
 * @param {string} [txid]
 * @param {number} [satsPerByte]
 */
export const setupCpfp = async ({
	txid,
	satsPerByte,
}: {
	txid?: string; // txid of utxo to include in the CPFP tx. Undefined will gather all utxo's.
	satsPerByte?: number;
}): Promise<Result<ISendTransaction>> => {
	const transaction = getOnChainWalletTransaction();
	// Set fastest fee-rate, if able. Otherwise, set the highest fee-rate.
	if (!satsPerByte) {
		const fees = getFeesStore().onchain;
		satsPerByte = fees[ETransactionSpeed.fast];
		const wallet = getOnChainWallet();
		const feeInfo = wallet.getFeeInfo();
		if (feeInfo.isErr()) {
			return err(feeInfo.error.message);
		}
		const { maxSatPerByte } = feeInfo.value;
		if (!satsPerByte || satsPerByte > maxSatPerByte) {
			satsPerByte = maxSatPerByte;
		}
	}
	return await transaction.setupCpfp({ txid, satsPerByte });
};

/**
 * Sets up a transaction for RBF.
 * @param {string} txid
 */
export const setupRbf = async ({
	txid,
}: {
	txid: string;
}): Promise<Result<Partial<ISendTransaction>>> => {
	try {
		await setupOnChainTransaction({
			rbf: true,
		});
		const response = await getRbfData({
			txHash: { tx_hash: txid },
		});
		if (response.isErr()) {
			if (response.error.message === 'cpfp') {
				return await setupCpfp({
					txid,
				});
			}
			return err(response.error.message);
		}
		const transaction = response.value;
		let newFee = transaction.fee;
		let _satsPerByte = 1;
		// Increment satsPerByte until the fee is greater than the previous + the default base fee.
		while (
			newFee <=
			transaction.fee + TRANSACTION_DEFAULTS.recommendedBaseFee
		) {
			newFee = getTotalFee({
				transaction,
				satsPerByte: _satsPerByte,
				message: transaction.message,
			});
			_satsPerByte++;
		}
		const inputTotal = getTransactionInputValue({
			inputs: transaction.inputs,
		});
		// Ensure we have enough funds to perform an RBF transaction.
		const outputTotal = getTransactionOutputValue({
			outputs: transaction.outputs,
		});
		if (outputTotal + newFee >= inputTotal || newFee >= inputTotal / 2) {
			/*
			 * We could always pull the fee from the output total,
			 * but this may negatively impact the transaction made by the user.
			 * (Ex: Reducing the amount paid to the recipient).
			 * We could always include additional unconfirmed utxo's to cover the fee as well,
			 * but this may negatively impact the user's privacy by including sensitive utxos.
			 * Instead of allowing either scenario, we attempt a CPFP instead.
			 */
			console.log(
				'Not enough sats to support an RBF transaction. Attempting to CPFP instead.',
			);
			return await setupCpfp({
				txid,
			});
		}
		const newTransaction: Partial<ISendTransaction> = {
			...transaction,
			minFee: _satsPerByte,
			fee: newFee,
			satsPerByte: _satsPerByte,
			rbf: true,
			boostType: EBoostType.rbf,
		};

		updateSendTransaction({
			transaction: newTransaction,
		});
		return ok(newTransaction);
	} catch (e) {
		return err(e);
	}
};

/**
 * Used to broadcast and update a boosted transaction as needed.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} oldTxId
 * @param {number} oldFee
 */
export const broadcastBoost = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	oldTxId,
	oldFee,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	oldTxId: string;
	oldFee: number;
}): Promise<Result<Partial<TOnchainActivityItem>>> => {
	try {
		const transactionDataResponse = getOnchainTransactionData();
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		const transaction = transactionDataResponse.value;

		const rawTx = await createTransaction({});
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
		let transactions =
			getWalletStore().wallets[selectedWallet].transactions[selectedNetwork];
		const boostedFee = transaction.fee;
		await addBoostedTransaction({
			newTxId,
			oldTxId,
			type: transaction.boostType,
			fee: boostedFee,
		});

		// Only delete the old transaction if it was an RBF, not a CPFP.
		if (transaction.boostType === EBoostType.rbf && oldTxId in transactions) {
			await deleteOnChainTransactionById({
				txid: oldTxId,
			});
		}

		const updatedActivityItemData: Partial<TOnchainActivityItem> = {
			txId: newTxId,
			address: transaction.changeAddress,
			fee: oldFee + transaction.fee,
			isBoosted: true,
			timestamp: new Date().getTime(),
		};

		await refreshWallet();
		return ok(updatedActivityItemData);
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

		const wallet = getOnChainWallet();
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
	const transaction = getOnchainTransactionData();
	if (transaction.isErr()) {
		return EFeeId.none;
	}
	return transaction.value.selectedFeeId;
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
	if (transaction.isErr()) {
		return err(transaction.error.message);
	}
	if (
		transaction.value.outputs?.length &&
		transaction.value.outputs?.length >= outputIndex + 1 &&
		transaction.value.outputs[outputIndex].value
	) {
		return ok(transaction.value.outputs[outputIndex]?.value ?? 0);
	}
	return ok(0);
};
