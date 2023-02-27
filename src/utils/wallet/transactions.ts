import * as bip21 from 'bip21';
import * as bip32 from 'bip32';
import { BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { Psbt } from 'bitcoinjs-lib';
import { err, ok, Result } from '@synonymdev/result';
import * as electrum from 'rn-electrum-client/helpers';
import validate, { getAddressInfo } from 'bitcoin-address-validation';

import { validateAddress } from '../scanner';
import { EAvailableNetworks, networks, TAvailableNetworks } from '../networks';
import {
	btcToSats,
	satsToBtc,
	reduceValue,
	getKeychainValue,
	shuffleArray,
} from '../helpers';
import {
	EBoostType,
	EPaymentType,
	IBitcoinTransactionData,
	IOutput,
	IUtxo,
	EAddressType,
	TGetByteCountInputs,
	TGetByteCountOutputs,
	TGetByteCountInput,
	TGetByteCountOutput,
	TWalletName,
} from '../../store/types/wallet';
import {
	getBalance,
	getCurrentWallet,
	getMnemonicPhrase,
	getOnChainBalance,
	getRbfData,
	getReceiveAddress,
	getScriptHash,
	getSelectedNetwork,
	getSelectedWallet,
	getTransactionById,
	IVin,
	IVout,
	refreshWallet,
} from './index';
import { getSettingsStore, getWalletStore } from '../../store/helpers';
import { objectKeys } from '../objectKeys';
import {
	addBoostedTransaction,
	deleteOnChainTransactionById,
	getChangeAddress,
	setupOnChainTransaction,
	updateBitcoinTransaction,
} from '../../store/actions/wallet';
import { TCoinSelectPreference } from '../../store/types/settings';
import { showErrorNotification } from '../notifications';
import { getTransactions, subscribeToAddresses } from './electrum';
import { TOnchainActivityItem } from '../../store/types/activity';
import { EFeeId, IOnchainFees } from '../../store/types/fees';
import { defaultFeesShape } from '../../store/shapes/fees';
import { defaultBitcoinTransactionData } from '../../store/shapes/wallet';
import { TRANSACTION_DEFAULTS } from './constants';

/*
 * Attempts to parse any given string as an on-chain payment request.
 * Returns an error if invalid.
 */
export const parseOnChainPaymentRequest = (
	data: string,
	selectedNetwork?: TAvailableNetworks,
): Result<{
	address: string;
	network: EAvailableNetworks;
	sats: number;
	message: string;
}> => {
	try {
		if (!data) {
			return err('No data provided to parseOnChainPaymentRequest.');
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}

		let validateAddressResult = validateAddress({
			address: data,
			selectedNetwork: EAvailableNetworks[selectedNetwork],
		});

		if (
			validateAddressResult.isValid &&
			!data.includes(':' || '?' || '&' || '//')
		) {
			return ok({
				address: data,
				network: validateAddressResult.network,
				sats: 0,
				message: '',
			});
		}

		//Determine if we need to parse any invoice data.
		if (data.includes(':' || '?' || '&' || '//')) {
			try {
				//Remove slashes
				if (data.includes('//')) {
					data = data.replace('//', '');
				}
				//bip21.decode will throw if anything other than "bitcoin" is passed to it.
				//Replace any instance of "testnet" or "litecoin" with "bitcoin"
				if (data.includes(':')) {
					data = data.substring(data.indexOf(':') + 1);
					data = `bitcoin:${data}`;
				}

				// types are wrong for package 'bip21'
				const result = bip21.decode(data) as {
					address: string;
					options: { [key: string]: string };
				};
				const address = result.address;
				validateAddressResult = validateAddress({ address });
				//Ensure address is valid
				if (!validateAddressResult.isValid) {
					return err(`Invalid address: ${data}`);
				}
				let amount = 0;
				let message = '';
				try {
					amount = Number(result.options.amount) || 0;
				} catch (e) {}
				try {
					message = result.options.message || '';
				} catch (e) {}
				return ok({
					address,
					network: validateAddressResult.network,
					sats: Number((amount * 100000000).toFixed(0)),
					message,
				});
			} catch {
				return err(data);
			}
		}
		return err(data);
	} catch {
		return err(data);
	}
};

const setReplaceByFee = ({
	psbt,
	setRbf = true,
}: {
	psbt: Psbt;
	setRbf: boolean;
}): void => {
	try {
		const defaultSequence = bitcoin.Transaction.DEFAULT_SEQUENCE;
		//Cannot set replace-by-fee on transaction without inputs.
		// @ts-ignore type for Psbt is wrong
		const ins = psbt.data.globalMap.unsignedTx.tx.ins;
		if (ins.length !== 0) {
			ins.forEach((x) => {
				if (setRbf) {
					if (x.sequence >= defaultSequence - 1) {
						x.sequence = 0;
					}
				} else {
					if (x.sequence < defaultSequence - 1) {
						x.sequence = defaultSequence;
					}
				}
			});
		}
	} catch (e) {}
};

/*
	Adapted from: https://gist.github.com/junderw/b43af3253ea5865ed52cb51c200ac19c
	Usage:
	getByteCount({'MULTISIG-P2SH:2-4':45},{'P2PKH':1}) Means "45 inputs of P2SH Multisig and 1 output of P2PKH"
	getByteCount({'P2PKH':1,'MULTISIG-P2SH:2-3':2},{'P2PKH':2}) means "1 P2PKH input and 2 Multisig P2SH (2 of 3) inputs along with 2 P2PKH outputs"
*/
export const getByteCount = (
	inputs: TGetByteCountInputs,
	outputs: TGetByteCountOutputs,
	message?: string,
): number => {
	try {
		// Base transaction weight
		let totalWeight = 40;
		let hasWitness = false;

		const types: {
			inputs: {
				[key in TGetByteCountInput]: number;
			};
			multiSigInputs: {
				'MULTISIG-P2SH': number;
				'MULTISIG-P2WSH': number;
				'MULTISIG-P2SH-P2WSH': number;
			};
			outputs: {
				[key in TGetByteCountOutput]: number;
			};
		} = {
			inputs: {
				P2WPKH: 108 + 41 * 4,
				p2wpkh: 108 + 41 * 4 + 1,
				P2PKH: 148 * 4,
				p2pkh: 148 * 4 + 1,
				P2SH: 108 + 64 * 4,
				p2sh: 108 + 64 * 4 + 1,
				'P2SH-P2WPKH': 108 + 64 * 4,
			},
			multiSigInputs: {
				'MULTISIG-P2SH': 49 * 4,
				'MULTISIG-P2WSH': 6 + 41 * 4,
				'MULTISIG-P2SH-P2WSH': 6 + 76 * 4,
			},
			outputs: {
				P2SH: 32 * 4,
				P2PKH: 34 * 4,
				P2WPKH: 31 * 4,
				P2WSH: 43 * 4,
				p2wpkh: 31 * 4 + 1,
				p2sh: 32 * 4 + 1,
				p2pkh: 34 * 4 + 1,
			},
		};

		const checkUInt53 = (n: number): void => {
			if (n < 0 || n > Number.MAX_SAFE_INTEGER || n % 1 !== 0) {
				throw new RangeError('value out of range');
			}
		};

		const inputKeys = objectKeys(inputs);
		inputKeys.forEach(function (key) {
			const input = inputs[key]!;
			checkUInt53(input);
			const addressTypeCount = input || 1;
			if (key.slice(0, 8) === 'MULTISIG') {
				// ex. "MULTISIG-P2SH:2-3" would mean 2 of 3 P2SH MULTISIG
				const keyParts = key.split(':');
				if (keyParts.length !== 2) {
					throw new Error('invalid input: ' + key);
				}
				const newKey = keyParts[0];
				const mAndN = keyParts[1].split('-').map((item) => parseInt(item, 10));

				totalWeight += types.multiSigInputs[newKey] * addressTypeCount;
				const multiplyer = newKey === 'MULTISIG-P2SH' ? 4 : 1;
				totalWeight +=
					(73 * mAndN[0] + 34 * mAndN[1]) * multiplyer * addressTypeCount;
			} else {
				totalWeight += types.inputs[key] * addressTypeCount;
			}
			if (['p2sh', 'P2SH', 'P2SH-P2WPKH', 'p2wpkh', 'P2WPKH'].includes(key)) {
				hasWitness = true;
			}
		});

		const outputKeys = objectKeys(outputs);
		outputKeys.forEach(function (key) {
			const output = outputs[key]!;
			checkUInt53(output);
			totalWeight += types.outputs[key] * output;
		});

		if (hasWitness) {
			totalWeight += 2;
		}

		if (message?.length) {
			// Multiply by 2 to help ensure Electrum servers will broadcast the tx.
			totalWeight += message.length * 2;
		}

		// Convert from Weight Units to virtual size
		return Math.ceil(totalWeight / 4);
	} catch (e) {
		return TRANSACTION_DEFAULTS.recommendedBaseFee;
	}
};

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
	satsPerByte = 2,
	selectedWallet,
	selectedNetwork,
	message = '',
	fundingLightning = false,
	transaction, // If left undefined, the method will retrieve the tx data from state.
}: {
	satsPerByte?: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	message?: string;
	fundingLightning?: boolean;
	transaction?: Partial<IBitcoinTransactionData>;
}): number => {
	const fallBackFee = TRANSACTION_DEFAULTS.recommendedBaseFee;
	try {
		if (!transaction) {
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			if (!selectedWallet) {
				selectedWallet = getSelectedWallet();
			}
			const txDataResponse = getOnchainTransactionData({
				selectedNetwork,
				selectedWallet,
			});
			if (txDataResponse.isErr()) {
				// If error, return minimum fallback fee.
				return Number(satsPerByte) * fallBackFee || fallBackFee;
			}
			transaction = txDataResponse.value;
		}

		const inputs = transaction.inputs || [];
		const outputs = transaction.outputs || [];
		const changeAddress = transaction.changeAddress;

		//Group all input & output addresses into their respective array.
		const inputAddresses = inputs.map((input) => input.address);
		const outputAddresses =
			outputs.map((output) => {
				if (output.address) {
					return output.address;
				}
			}) || [];
		if (changeAddress) {
			outputAddresses.push(changeAddress);
		}

		//Determine the address type of each address and construct the object for fee calculation
		const inputParam = constructByteCountParam(inputAddresses);
		// @ts-ignore
		const outputParam = constructByteCountParam(outputAddresses);
		//Increase P2WPKH output address by one for lightning funding calculation.
		if (fundingLightning) {
			outputParam.P2WPKH = (outputParam.P2WPKH || 0) + 1;
		}

		const transactionByteCount = getByteCount(inputParam, outputParam, message);
		return transactionByteCount * Number(satsPerByte);
	} catch {
		return Number(satsPerByte) * fallBackFee || fallBackFee;
	}
};

export interface ICreateTransaction {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	transactionData?: IBitcoinTransactionData;
}

export interface ICreatePsbt {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
}

interface ITargets extends IOutput {
	script?: Buffer;
}

/**
 * Creates a BIP32Interface from the selected wallet's mnemonic and passphrase
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {Promise<Result<BIP32Interface>>}
 */
const getBip32Interface = async (
	selectedWallet: TWalletName,
	selectedNetwork: TAvailableNetworks,
): Promise<Result<BIP32Interface>> => {
	const network = networks[selectedNetwork];

	const getMnemonicPhraseResult = await getMnemonicPhrase(selectedWallet);
	if (getMnemonicPhraseResult.isErr()) {
		return err(getMnemonicPhraseResult.error.message);
	}

	//Attempt to acquire the bip39Passphrase if available
	let bip39Passphrase = '';
	try {
		const key = `${selectedWallet}passphrase`;
		const bip39PassphraseResult = await getKeychainValue({ key });
		if (!bip39PassphraseResult.error && bip39PassphraseResult.data) {
			bip39Passphrase = bip39PassphraseResult.data;
		}
	} catch {}

	const mnemonic = getMnemonicPhraseResult.value;
	const seed = await bip39.mnemonicToSeed(mnemonic, bip39Passphrase);
	const root = bip32.fromSeed(seed, network);

	return ok(root);
};

/**
 * Returns a PSBT that includes unsigned funding inputs.
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {IBitcoinTransactionData} transactionData
 * @param {BIP32Interface} bip32Interface
 * @return {Promise<Result<Psbt>>}
 */
const createPsbtFromTransactionData = async ({
	selectedWallet,
	selectedNetwork,
	transactionData,
	bip32Interface,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	transactionData: IBitcoinTransactionData;
	bip32Interface?: BIP32Interface;
}): Promise<Result<Psbt>> => {
	const {
		inputs = [],
		outputs = [],
		fee = TRANSACTION_DEFAULTS.recommendedBaseFee,
		rbf,
	} = transactionData;
	let { changeAddress, message } = transactionData;

	//Get balance of current inputs.
	const balance = getTransactionInputValue({
		selectedWallet,
		selectedNetwork,
		inputs,
	});

	//Get value of current outputs.
	const outputValue = getTransactionOutputValue({
		selectedNetwork,
		selectedWallet,
		outputs,
	});

	const network = networks[selectedNetwork];

	//Collect all outputs.
	let targets: ITargets[] = await Promise.all(outputs.map((output) => output));

	//Change address and amount to send back to wallet.
	if (changeAddress !== '') {
		const changeAddressValue = balance - (outputValue + fee);
		// Ensure we're not creating unspendable dust.
		// If we have less than 2x the recommended base fee, just contribute it to the fee in this transaction.
		if (changeAddressValue > TRANSACTION_DEFAULTS.dustLimit) {
			targets.push({
				address: changeAddress,
				value: changeAddressValue,
				index: targets.length,
			});
		}
		// Looks like we don't need a change address.
		// Double check we don't have any spare sats hanging around.
	} else if (outputValue + fee < balance) {
		// If we have spare sats hanging around and the difference is greater than the dust limit, generate a changeAddress to send them to.
		const diffValue = balance - (outputValue + fee);
		if (diffValue > TRANSACTION_DEFAULTS.dustLimit) {
			const changeAddressRes = await getChangeAddress({
				selectedWallet,
				selectedNetwork,
			});
			if (changeAddressRes.isErr()) {
				return err(changeAddressRes.error.message);
			}
			changeAddress = changeAddressRes.value.address;
			targets.push({
				address: changeAddress,
				value: diffValue,
				index: targets.length,
			});
		}
	}

	//Embed any OP_RETURN messages.
	if (message && message.trim() !== '') {
		const messageLength = message.length;
		const lengthMin = 5;
		//This is a patch for the following: https://github.com/coreyphillips/moonshine/issues/52
		if (messageLength > 0 && messageLength < lengthMin) {
			message += ' '.repeat(lengthMin - messageLength);
		}
		const data = Buffer.from(message, 'utf8');
		const embed = bitcoin.payments.embed({
			data: [data],
			network,
		});
		targets.push({ script: embed.output!, value: 0, index: targets.length });
	}

	if (!bip32Interface) {
		const bip32InterfaceRes = await getBip32Interface(
			selectedWallet,
			selectedNetwork,
		);
		if (bip32InterfaceRes.isErr()) {
			return err(bip32InterfaceRes.error.message);
		}
		bip32Interface = bip32InterfaceRes.value;
	}

	const root = bip32Interface;
	const psbt = new bitcoin.Psbt({ network });

	//Add Inputs from inputs array
	try {
		for await (const input of inputs) {
			const path = input.path;
			const keyPair: BIP32Interface = root.derivePath(path);
			await addInput({
				psbt,
				keyPair,
				input,
				selectedNetwork,
			});
		}
	} catch (e) {
		return err(e);
	}

	//Set RBF if supported and prompted via rbf in Settings.
	setReplaceByFee({ psbt, setRbf: !!rbf });

	// Shuffle targets if not run from unit test and add outputs.
	if (process.env.JEST_WORKER_ID === undefined) {
		targets = shuffleArray(targets);
	}

	await Promise.all(
		targets.map((target) => {
			//Check if OP_RETURN
			let isOpReturn = false;
			try {
				isOpReturn = !!target.script;
			} catch (e) {}
			if (isOpReturn) {
				if (target?.script) {
					psbt.addOutput({
						script: target.script,
						value: target.value ?? 0,
					});
				}
			} else {
				if (target?.address && target?.value) {
					psbt.addOutput({
						address: target.address,
						value: target.value,
					});
				}
			}
		}),
	);

	return ok(psbt);
};

/**
 * Uses the transaction data store to create an unsigned PSBT with funded inputs
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 */
export const createFundedPsbtTransaction = async ({
	selectedWallet,
	selectedNetwork,
}: ICreatePsbt): Promise<Result<Psbt>> => {
	const transactionData = getOnchainTransactionData({
		selectedWallet,
		selectedNetwork,
	});

	if (transactionData.isErr()) {
		return err(transactionData.error.message);
	}

	//Create PSBT before signing inputs
	return await createPsbtFromTransactionData({
		selectedWallet,
		selectedNetwork,
		transactionData: transactionData.value,
	});
};

export const signPsbt = ({
	selectedWallet,
	selectedNetwork,
	bip32Interface,
	psbt,
}: {
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
	bip32Interface?: BIP32Interface;
	psbt: Psbt;
}): Promise<Result<Psbt>> => {
	return new Promise(async (resolve) => {
		//Loop through and sign our inputs
		if (!bip32Interface) {
			const bip32InterfaceRes = await getBip32Interface(
				selectedWallet,
				selectedNetwork,
			);
			if (bip32InterfaceRes.isErr()) {
				return resolve(err(bip32InterfaceRes.error.message));
			}
			bip32Interface = bip32InterfaceRes.value;
		}

		const root = bip32Interface;

		const transactionDataRes = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});

		if (transactionDataRes.isErr()) {
			return err(transactionDataRes.error.message);
		}

		const { inputs = [] } = transactionDataRes.value;
		await Promise.all(
			inputs.map((input, i) => {
				try {
					const path = input.path;
					const keyPair = root.derivePath(path);
					psbt.signInput(i, keyPair);
				} catch (e) {
					return resolve(err(e));
				}
			}),
		);
		psbt.finalizeAllInputs();
		return resolve(ok(psbt));
	});
};

/**
 * Creates complete signed transaction using the transaction data store
 * @param selectedWallet
 * @param selectedNetwork
 * @param {IBitcoinTransactionData} [transactionData]
 * @returns {Promise<Result<{id: string, hex: string}>>}
 */
export const createTransaction = async ({
	selectedWallet,
	selectedNetwork,
	transactionData,
}: ICreateTransaction = {}): Promise<Result<{ id: string; hex: string }>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	// If no transaction data is provided, use the stored transaction object from storage.
	if (!transactionData) {
		const transactionDataRes = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transactionDataRes.isErr()) {
			return err(transactionDataRes.error.message);
		}
		transactionData = transactionDataRes.value;
	}

	//Remove any outputs that are below the dust limit and apply them to the fee.
	removeDustOutputs(transactionData.outputs);

	const inputValue = getTransactionInputValue({
		selectedNetwork,
		selectedWallet,
		inputs: transactionData.inputs,
	});
	const outputValue = getTransactionOutputValue({
		selectedWallet,
		selectedNetwork,
		outputs: transactionData.outputs,
	});
	if (inputValue === 0) {
		const message = 'No inputs to spend.';
		showErrorNotification({
			title: 'Unable to create transaction.',
			message,
		});
		return err(message);
	}
	const fee = inputValue - outputValue;

	//Refuse tx if the fee is greater than the amount we're attempting to send.
	if (fee > inputValue) {
		const message = 'Fee is larger than the intended payment.';
		showErrorNotification({ title: 'Unable to create transaction', message });
		return err(message);
	}
	try {
		const bip32InterfaceRes = await getBip32Interface(
			selectedWallet,
			selectedNetwork,
		);
		if (bip32InterfaceRes.isErr()) {
			return err(bip32InterfaceRes.error.message);
		}

		//Create PSBT before signing inputs
		const psbtRes = await createPsbtFromTransactionData({
			selectedWallet,
			selectedNetwork,
			transactionData,
			bip32Interface: bip32InterfaceRes.value,
		});

		if (psbtRes.isErr()) {
			return err(psbtRes.error);
		}

		const psbt = psbtRes.value;

		const signedPsbtRes = await signPsbt({
			selectedWallet,
			selectedNetwork,
			psbt,
			bip32Interface: bip32InterfaceRes.value,
		});

		if (signedPsbtRes.isErr()) {
			return err(signedPsbtRes.error);
		}

		const tx = signedPsbtRes.value.extractTransaction();
		const id = tx.getId();
		const hex = tx.toHex();
		return ok({ id, hex });
	} catch (e) {
		return err(e);
	}
};

/**
 * Removes outputs that are below the dust limit.
 * @param {IOutput[]} outputs
 * @returns {IOutput[]}
 */
export const removeDustOutputs = (outputs: IOutput[]): IOutput[] => {
	return outputs.filter((output) => {
		return output.value && output.value > TRANSACTION_DEFAULTS.dustLimit;
	});
};

/**
 * Returns onchain transaction data related to the specified network and wallet.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getOnchainTransactionData = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<IBitcoinTransactionData> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const transaction =
			getWalletStore().wallets[selectedWallet].transaction[selectedNetwork];
		if (transaction) {
			return ok(transaction);
		}
		return err('Unable to get transaction data.');
	} catch (e) {
		return err(e);
	}
};
export interface IAddInput {
	psbt: Psbt;
	keyPair: BIP32Interface;
	input: IUtxo;
	selectedNetwork?: TAvailableNetworks;
}
export const addInput = async ({
	psbt,
	keyPair,
	input,
	selectedNetwork,
}: IAddInput): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const network = networks[selectedNetwork];
		const { type } = getAddressInfo(input.address);

		if (!input?.value) {
			return err('No input provided.');
		}

		if (type === 'p2wpkh') {
			const p2wpkh = bitcoin.payments.p2wpkh({
				pubkey: keyPair.publicKey,
				network,
			});
			if (!p2wpkh?.output) {
				return err('p2wpkh.output is undefined.');
			}
			psbt.addInput({
				hash: input.tx_hash,
				index: input.tx_pos,
				witnessUtxo: {
					script: p2wpkh.output,
					value: input.value,
				},
			});
		}

		if (type === 'p2sh') {
			const p2wpkh = bitcoin.payments.p2wpkh({
				pubkey: keyPair.publicKey,
				network,
			});
			const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
			if (!p2sh?.output) {
				return err('p2sh.output is undefined.');
			}
			if (!p2sh?.redeem) {
				return err('p2sh.redeem.output is undefined.');
			}
			psbt.addInput({
				hash: input.tx_hash,
				index: input.tx_pos,
				witnessUtxo: {
					script: p2sh.output,
					value: input.value,
				},
				redeemScript: p2sh.redeem.output,
			});
		}

		if (type === 'p2pkh') {
			const transaction = await getTransactions({
				selectedNetwork,
				txHashes: [{ tx_hash: input.tx_hash }],
			});
			if (transaction.isErr()) {
				return err(transaction.error.message);
			}
			const hex = transaction.value.data[0].result.hex;
			const nonWitnessUtxo = Buffer.from(hex, 'hex');
			psbt.addInput({
				hash: input.tx_hash,
				index: input.tx_pos,
				nonWitnessUtxo,
			});
		}
		return ok('Success');
	} catch {
		return err('Unable to add input.');
	}
};

export const broadcastTransaction = async ({
	rawTx = '',
	selectedNetwork,
	selectedWallet,
	subscribeToOutputAddress = true,
}: {
	rawTx: string;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	subscribeToOutputAddress?: boolean;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	/**
	 * Subscribe to the output address and refresh the wallet when the Electrum server detects it.
	 * This prevents updating the wallet prior to the Electrum server detecting the new tx in the mempool.
	 */
	if (subscribeToOutputAddress) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		const transaction = await getOnchainTransactionData({
			selectedNetwork,
			selectedWallet,
		});
		if (transaction.isErr()) {
			return err(transaction.error.message);
		}
		const address = transaction.value.outputs?.[0]?.address;
		if (address) {
			const scriptHash = await getScriptHash(address, selectedNetwork);
			if (scriptHash) {
				await subscribeToAddresses({
					selectedNetwork,
					scriptHashes: [scriptHash],
				});
			}
		}
	}

	const broadcastResponse = await electrum.broadcastTransaction({
		rawTx,
		network: selectedNetwork,
	});
	// TODO: This needs to be resolved in rn-electrum-client
	if (broadcastResponse.error || broadcastResponse.data.includes(' ')) {
		return err(broadcastResponse.data);
	}
	return ok(broadcastResponse.data);
};

/**
 * Returns total value of all outputs. Excludes any value that would be sent to the change address.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {IOutput[]} [outputs]
 * @returns {number}
 */
export const getTransactionOutputValue = ({
	selectedWallet,
	selectedNetwork,
	outputs,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	outputs?: IOutput[];
}): number => {
	try {
		if (!outputs) {
			if (!selectedWallet) {
				selectedWallet = getSelectedWallet();
			}
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			const transaction = getOnchainTransactionData({
				selectedWallet,
				selectedNetwork,
			});
			if (transaction.isErr()) {
				return 0;
			}
			outputs = transaction.value.outputs || [];
		}
		if (outputs) {
			const response = reduceValue({ arr: outputs, value: 'value' });
			if (response.isOk()) {
				return response.value;
			}
		}
		return 0;
	} catch (e) {
		console.log(e);
		return 0;
	}
};

/**
 * Returns total value of all utxos.
 * @param selectedWallet
 * @param selectedNetwork
 * @param utxos
 */
export const getTransactionInputValue = ({
	selectedWallet,
	selectedNetwork,
	inputs,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	inputs?: IUtxo[];
}): number => {
	try {
		if (!inputs) {
			if (!selectedWallet) {
				selectedWallet = getSelectedWallet();
			}
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			const transaction = getOnchainTransactionData({
				selectedWallet,
				selectedNetwork,
			});
			if (transaction.isErr()) {
				return 0;
			}
			inputs = transaction.value.inputs;
		}
		if (inputs) {
			const response = reduceValue({ arr: inputs, value: 'value' });
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
 * Returns all inputs for the current transaction.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getTransactionInputs = ({
	selectedWallet,
	selectedNetwork,
}: {
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
		return ok(txData.value.inputs?.map((input) => input) ?? []);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Updates the fee for the current transaction by the specified amount.
 * @param {number} [satsPerByte]
 * @param {EFeeId} [selectedFeeId]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {number} [index]
 * @param {IBitcoinTransactionData} [transaction]
 */
export const updateFee = ({
	satsPerByte,
	selectedFeeId = EFeeId.custom,
	selectedWallet,
	selectedNetwork,
	index = 0,
	transaction,
}: {
	satsPerByte: number;
	selectedFeeId?: EFeeId;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	index?: number;
	transaction?: IBitcoinTransactionData;
}): Result<string> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!transaction) {
		const transactionDataResponse = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		transaction = transactionDataResponse?.value ?? {
			...defaultBitcoinTransactionData,
		};
	}
	const inputTotal = getTransactionInputValue({
		selectedNetwork,
		selectedWallet,
		inputs: transaction.inputs,
	});

	const max = transaction.max;
	const message = transaction.message;
	const outputs = transaction.outputs;
	let address = '';
	if (outputs.length > index) {
		address = outputs[index]?.address ?? '';
	}

	//Check that the user has enough funds
	const newFee = getTotalFee({
		satsPerByte,
		message,
	});

	//Return if the new fee exceeds half of the user's balance
	if (Number(newFee) >= inputTotal / 2) {
		return err(
			'Unable to increase the fee any further. Otherwise, it will exceed half the current balance.',
		);
	}

	const totalTransactionValue = getTransactionOutputValue({
		selectedWallet,
		selectedNetwork,
	});
	const newTotalAmount = Number(totalTransactionValue) + Number(newFee);
	const _transaction: Partial<IBitcoinTransactionData> = {
		satsPerByte,
		fee: newFee,
		selectedFeeId,
	};

	if (max) {
		//Update the tx value with the new fee to continue sending the max amount.
		_transaction.outputs = [{ address, value: inputTotal - newFee, index }];
	}

	if (max || newTotalAmount <= inputTotal) {
		updateBitcoinTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: _transaction,
		});
		return ok('Successfully updated the transaction fee.');
	}
	return err(
		'New total amount exceeds the available balance. Unable to update the transaction fee.',
	);
};

/**
 * Returns a block explorer URL for a specific transaction
 * @param {string} id
 * @param {'tx' | 'address'} type
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {'blockstream' | 'mempool'} [service]
 */
export const getBlockExplorerLink = (
	id: string,
	type: 'tx' | 'address' = 'tx',
	selectedNetwork?: TAvailableNetworks,
	service: 'blockstream' | 'mempool' = 'mempool',
): string => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
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

export interface IAddressTypes {
	inputs: {
		[key in EAddressType]: number;
	};
	outputs: {
		[key in EAddressType]: number;
	};
}
/**
 * Returns the transaction fee and outputs along with the inputs that best fit the sort method.
 * @async
 * @param {IAddress[]} [inputs]
 * @param {IAddress[]} [outputs]
 * @param {number} [satsPerByte]
 * @param {sortMethod}
 * @return {Promise<number>}
 */
export interface ICoinSelectResponse {
	fee: number;
	inputs: IUtxo[];
	outputs: IOutput[];
}
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
		} as IAddressTypes;

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
 * Used to validate transaction form data.
 * @param {IBitcoinTransactionData} transaction
 * @return {Result<string>}
 */
export const validateTransaction = (
	transaction: IBitcoinTransactionData,
): Result<string> => {
	const baseFee = TRANSACTION_DEFAULTS.recommendedBaseFee;

	try {
		if (!transaction.fee) {
			return err('No transaction fee provided.');
		}
		if (
			!transaction.outputs ||
			transaction.outputs?.length < 1 ||
			!transaction.outputs[0].address
		) {
			return err('Please provide an address to send funds to.');
		}
		if (
			!transaction.inputs ||
			(transaction.outputs?.length > 0 && !transaction.outputs[0]?.value)
		) {
			return err('Please provide an amount to send.');
		}
		const inputs = transaction.inputs ?? [];
		const outputs = transaction.outputs ?? [];
		for (let i = 0; i < outputs.length; i++) {
			const address = outputs[i]?.address ?? '';
			const value = outputs[i]?.value ?? 0;
			const { isValid } = validateAddress({ address });
			if (!isValid) {
				return err(`Invalid Address: ${address}`);
			}
			if (value < baseFee) {
				return err(
					`Output value for ${address} must be greater than or equal to ${baseFee} sats`,
				);
			}
			if (!Number.isInteger(value)) {
				return err(`Output value for ${address} should be an integer`);
			}
		}

		const inputsReduce = reduceValue({
			arr: inputs,
			value: 'value',
		});
		if (inputsReduce.isErr()) {
			return err(inputsReduce.error.message);
		}
		//Remove the change address from the outputs array, if any.
		let filteredOutputs = outputs;
		if (transaction.changeAddress) {
			filteredOutputs = outputs.filter((output) => {
				return output.address !== transaction.changeAddress;
			});
		}
		const outputsReduce = reduceValue({
			arr: filteredOutputs,
			value: 'value',
		});
		if (outputsReduce.isErr()) {
			return err(outputsReduce.error.message);
		}

		return ok('Transaction is valid.');
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
		let type = EPaymentType.sent;
		if (!txid) {
			return failure;
		}
		const settings = getSettingsStore();
		const rbfEnabled = settings.rbf;
		const transactionResponse = getTransactionById({ txid });
		if (transactionResponse.isErr()) {
			return failure;
		}
		if (transactionResponse.value.height > 0) {
			return failure;
		}
		type = transactionResponse.value.type;

		const balance = getOnChainBalance();
		const { currentWallet, selectedNetwork } = getCurrentWallet();

		const hasUtxo = currentWallet.utxos[selectedNetwork].some(
			(utxo) => txid === utxo.tx_hash,
		);

		/*
		 * For an RBF, technically we can reduce the output value and apply it to the fee,
		 * but this might cause issues when paying a merchant that requested a specific amount.
		 */

		const { matchedOutputValue, totalOutputValue, fee, height } =
			transactionResponse.value;
		const rbf =
			rbfEnabled &&
			type === EPaymentType.sent &&
			height <= 0 &&
			balance >= TRANSACTION_DEFAULTS.recommendedBaseFee &&
			matchedOutputValue !== totalOutputValue &&
			matchedOutputValue > fee &&
			btcToSats(matchedOutputValue) > TRANSACTION_DEFAULTS.recommendedBaseFee;

		// Performing a CPFP tx requires a new tx and higher fee.
		const cpfp =
			height <= 0 &&
			hasUtxo &&
			btcToSats(matchedOutputValue) >=
				TRANSACTION_DEFAULTS.recommendedBaseFee * 3;
		return { canBoost: rbf || cpfp, rbf, cpfp };
	} catch (e) {
		return failure;
	}
};

/**
 * Sends the max amount to the provided output index.
 * @param {string} [address] If left undefined, the current receiving address will be provided.
 * @param transaction
 * @param selectedNetwork
 * @param selectedWallet
 * @param index
 */
export const sendMax = ({
	address,
	transaction,
	selectedNetwork,
	selectedWallet,
	index = 0,
}: {
	address?: string;
	transaction?: Partial<IBitcoinTransactionData>;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	index?: number;
} = {}): Result<string> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
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
		const outputs = transaction?.outputs ?? [];
		// No address specified, attempt to assign the address currently specified in the current output index.
		if (!address) {
			address = outputs[index]?.address ?? '';
		}

		let inputTotal = 0;
		const max = transaction?.max;

		if (transaction?.lightningInvoice) {
			// lightning transaction
			const { satoshis } = getBalance({
				lightning: true,
				selectedWallet,
				selectedNetwork,
			});
			inputTotal = satoshis;

			if (!max && inputTotal > 0) {
				const _transaction: Partial<IBitcoinTransactionData> = {
					outputs: [{ address, value: inputTotal, index }],
					max: !max,
				};
				updateBitcoinTransaction({
					selectedWallet,
					selectedNetwork,
					transaction: _transaction,
				});
			} else {
				updateBitcoinTransaction({
					selectedWallet,
					selectedNetwork,
					transaction: { max: !max },
				});
			}
		} else {
			// onchain transaction
			inputTotal = getTransactionInputValue({
				selectedNetwork,
				selectedWallet,
				inputs: transaction.inputs,
			});

			if (
				!max &&
				inputTotal > 0 &&
				transaction?.fee &&
				inputTotal / 2 > transaction.fee
			) {
				const newFee = getTotalFee({
					satsPerByte: transaction.satsPerByte ?? 1,
					message: transaction.message,
					transaction,
				});
				const _transaction: Partial<IBitcoinTransactionData> = {
					fee: newFee,
					outputs: [{ address, value: inputTotal - newFee, index }],
					max: !max,
				};
				updateBitcoinTransaction({
					selectedWallet,
					selectedNetwork,
					transaction: _transaction,
				});
			} else {
				updateBitcoinTransaction({
					selectedWallet,
					selectedNetwork,
					transaction: { max: !max },
				});
			}
		}

		return ok('Successfully setup max send transaction.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Adjusts the fee by a given sat per byte.
 * @param {number} [adjustBy]
 * @param {IBitcoinTransactionData} [transaction]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const adjustFee = ({
	adjustBy,
	transaction,
	selectedNetwork,
	selectedWallet,
}: {
	adjustBy: number;
	transaction?: IBitcoinTransactionData;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Result<string> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
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
		// const coinSelectPreference = getStore().settings.coinSelectPreference;
		const satsPerByte = transaction.satsPerByte ?? 1;
		const newSatsPerByte = satsPerByte + adjustBy;
		if (newSatsPerByte < 1) {
			return ok('This is the lowest we can go. Returning...');
		}
		const response = updateFee({
			transaction,
			selectedWallet,
			selectedNetwork,
			satsPerByte: newSatsPerByte,
			selectedFeeId: EFeeId.custom,
		});
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
 * @param {string} amount
 * @param {number} [index]
 * @param {IBitcoinTransactionData} [transaction]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @param {boolean} [max]
 */
export const updateAmount = async ({
	amount,
	index = 0,
	transaction,
	selectedNetwork,
	selectedWallet,
	max = false,
}: {
	amount: string;
	index?: number;
	transaction?: IBitcoinTransactionData;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	max?: boolean;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
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

	let newAmount = Number(amount);
	let inputTotal = 0;
	const outputs = transaction.outputs;

	if (transaction.lightningInvoice) {
		// lightning transaction
		const { satoshis } = getBalance({
			lightning: true,
			selectedWallet,
			selectedNetwork,
		});
		inputTotal = satoshis;

		if (newAmount === inputTotal) {
			max = true;
		}
	} else {
		// onchain transaction
		const satsPerByte = transaction.satsPerByte;
		const message = transaction.message;

		let totalNewAmount = 0;
		const totalFee = getTotalFee({
			satsPerByte,
			message,
			selectedWallet,
			selectedNetwork,
		});

		inputTotal = getTransactionInputValue({
			selectedNetwork,
			selectedWallet,
			inputs: transaction.inputs,
		});

		if (newAmount !== 0) {
			totalNewAmount = newAmount + totalFee;
			if (totalNewAmount > inputTotal && inputTotal - totalFee < 0) {
				newAmount = 0;
			}
		}

		if (totalNewAmount > inputTotal) {
			return err('New amount exceeds the current balance.');
		}

		if (totalNewAmount === inputTotal) {
			max = true;
		}
	}

	let address = '';
	let value = 0;
	if (outputs.length > index) {
		value = outputs[index].value ?? 0;
		address = outputs[index].address ?? '';
	}

	//Return if the new amount exceeds the current balance or there is no change detected.
	if (newAmount === value) {
		return ok('No change detected. No need to update.');
	}
	if (newAmount > inputTotal) {
		return err('New amount exceeds the current balance.');
	}

	const output = { address, value: newAmount, index };
	updateBitcoinTransaction({
		selectedWallet,
		selectedNetwork,
		transaction: {
			outputs: [output],
			max,
		},
	});
	return ok('');
};

/**
 * Updates the OP_RETURN message.
 * CURRENTLY UNUSED
 * @param {string} message
 * @param {IBitcoinTransactionData} [transaction]
 * @param {number} [index]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateMessage = async ({
	message,
	transaction,
	index = 0,
	selectedWallet,
	selectedNetwork,
}: {
	message: string;
	transaction?: IBitcoinTransactionData;
	index?: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
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
	const max = transaction?.max;
	const satsPerByte = transaction?.satsPerByte ?? 1;
	const outputs = transaction?.outputs ?? [];
	const inputs = transaction?.inputs ?? [];

	const newFee = getTotalFee({ satsPerByte, message });
	const inputTotal = getTransactionInputValue({
		selectedWallet,
		selectedNetwork,
		inputs,
	});
	const outputTotal = getTransactionOutputValue({
		selectedWallet,
		selectedNetwork,
		outputs,
	});
	const totalNewAmount = outputTotal + newFee;
	let address = '';
	if (outputs?.length > index) {
		address = outputs[index].address ?? '';
	}
	const _transaction: Partial<IBitcoinTransactionData> = {
		message,
		fee: newFee,
	};
	if (max) {
		_transaction.outputs = [{ address, value: inputTotal - newFee, index }];
		//Update the tx value with the new fee to continue sending the max amount.
		updateBitcoinTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: _transaction,
		});
		return ok('Successfully updated the message.');
	}
	if (totalNewAmount <= inputTotal) {
		updateBitcoinTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: _transaction,
		});
	}
	return ok('Successfully updated the message.');
};

/**
 * Runs & Applies the autoCoinSelect method to the current transaction.
 * @param {IBitcoinTransactionData} [transaction]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
//TODO: Uncomment and utilize the following runCoinSelect method once the send flow is complete.
/*
const runCoinSelect = async ({
	transaction,
	selectedWallet,
	selectedNetwork,
}: {
	transaction?: IBitcoinTransactionData;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
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
			const updatedTx: IBitcoinTransactionData = {
				fee: autoCoinSelectResponse.value.fee,
				inputs: autoCoinSelectResponse.value.inputs,
			};
			updateBitcoinTransaction({
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} txid
 */
export const setupBoost = async ({
	txid,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<Partial<IBitcoinTransactionData>>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const canBoostResponse = canBoost(txid);
	if (!canBoostResponse.canBoost) {
		return err('Unable to boost this transaction.');
	}
	if (canBoostResponse.rbf) {
		return await setupRbf({ selectedWallet, selectedNetwork, txid });
	} else {
		return await setupCpfp({ selectedNetwork, selectedWallet, txid });
	}
};

/**
 * Sets up a CPFP transaction.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [txid]
 * @param {number} [satsPerByte]
 */
export const setupCpfp = async ({
	selectedWallet,
	selectedNetwork,
	txid,
	satsPerByte,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	txid?: string; // txid of utxo to include in the CPFP tx. Undefined will gather all utxo's.
	satsPerByte?: number;
}): Promise<Result<Partial<IBitcoinTransactionData>>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const response = await setupOnChainTransaction({
		selectedWallet,
		selectedNetwork,
		inputTxHashes: txid ? [txid] : undefined,
		rbf: true,
	});
	if (response.isErr()) {
		return err(response.error?.message);
	}

	const receiveAddress = await getReceiveAddress({
		selectedWallet,
		selectedNetwork,
	});
	if (receiveAddress.isErr()) {
		return err(receiveAddress.error.message);
	}

	// Construct the tx to send funds back to ourselves using the assigned inputs, receive address and fee.
	const sendMaxResponse = sendMax({
		selectedWallet,
		selectedNetwork,
		transaction: {
			...response.value,
			satsPerByte: satsPerByte ?? response.value.satsPerByte,
			boostType: EBoostType.cpfp,
		},
		address: receiveAddress.value,
	});
	if (sendMaxResponse.isErr()) {
		return err(sendMaxResponse.error.message);
	}

	const transaction =
		getWalletStore().wallets[selectedWallet].transaction[selectedNetwork];
	return ok(transaction);
};

/**
 * Sets up a transaction for RBF.
 * @param {string} txid
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const setupRbf = async ({
	txid,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<Partial<IBitcoinTransactionData>>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		await setupOnChainTransaction({
			selectedNetwork,
			selectedWallet,
			rbf: true,
		});
		const response = await getRbfData({
			txHash: { tx_hash: txid },
			selectedNetwork,
			selectedWallet,
		});
		if (response.isErr()) {
			if (response.error.message === 'cpfp') {
				return await setupCpfp({
					selectedNetwork,
					selectedWallet,
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
				selectedNetwork,
				selectedWallet,
				txid,
			});
		}
		const newTransaction: Partial<IBitcoinTransactionData> = {
			...transaction,
			minFee: _satsPerByte,
			fee: newFee,
			satsPerByte: _satsPerByte,
			rbf: true,
			boostType: EBoostType.rbf,
		};

		updateBitcoinTransaction({
			selectedWallet,
			selectedNetwork,
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} oldTxId
 */
export const broadcastBoost = async ({
	selectedWallet,
	selectedNetwork,
	oldTxId,
	oldFee,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	oldTxId: string;
	oldFee: number;
}): Promise<Result<Partial<TOnchainActivityItem>>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const transactionDataResponse = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transactionDataResponse.isErr()) {
			return err(transactionDataResponse.error.message);
		}
		const transaction = transactionDataResponse.value;

		const rawTx = await createTransaction({
			selectedNetwork,
			selectedWallet,
		});
		if (rawTx.isErr()) {
			return err(rawTx.error.message);
		}

		const broadcastResult = await broadcastTransaction({
			rawTx: rawTx.value.hex,
			selectedNetwork,
			subscribeToOutputAddress: false,
		});
		if (broadcastResult.isErr()) {
			return err(broadcastResult.error.message);
		}
		const newTxId = broadcastResult.value;
		let transactions =
			getWalletStore().wallets[selectedWallet].transactions[selectedNetwork];
		const boostedFee = transaction.fee ?? 0;
		await addBoostedTransaction({
			newTxId,
			oldTxId,
			type: transaction.boostType,
			selectedWallet,
			selectedNetwork,
			fee: boostedFee,
		});

		// Only delete the old transaction if it was an RBF, not a CPFP.
		if (transaction.boostType === EBoostType.rbf && oldTxId in transactions) {
			await deleteOnChainTransactionById({
				txid: oldTxId,
				selectedNetwork,
				selectedWallet,
			});
		}

		const updatedActivityItemData: Partial<TOnchainActivityItem> = {
			txId: newTxId,
			address: transaction.changeAddress ?? '',
			fee: oldFee + satsToBtc(Number(transaction.fee)),
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
 * Attempts to decode a tx hex.
 * Source: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1606#issuecomment-664740672
 * @param {string} hex
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const decodeRawTransaction = (
	hex: string,
	selectedNetwork?: TAvailableNetworks,
): Result<{
	txid: string;
	tx_hash: string;
	size: number;
	vsize: number;
	weight: number;
	version: number;
	locktime: number;
	vin: IVin[];
	vout: IVout[];
}> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const network = networks[selectedNetwork];
		const tx = bitcoin.Transaction.fromHex(hex);
		return ok({
			txid: tx.getId(),
			tx_hash: tx.getHash(true).toString('hex'),
			size: tx.byteLength(),
			vsize: tx.virtualSize(),
			weight: tx.weight(),
			version: tx.version,
			locktime: tx.locktime,
			vin: tx.ins.map((input) => ({
				txid: Buffer.from(input.hash).reverse().toString('hex'),
				vout: input.index,
				scriptSig: {
					asm: bitcoin.script.toASM(input.script),
					hex: input.script.toString('hex'),
				},
				txinwitness: input.witness.map((b) => b.toString('hex')),
				sequence: input.sequence,
			})),
			vout: tx.outs.map((output, i) => {
				let address;
				try {
					address = bitcoin.address.fromOutputScript(output.script, network);
				} catch (e) {}
				return {
					value: output.value,
					n: i,
					scriptPubKey: {
						asm: bitcoin.script.toASM(output.script),
						hex: output.script.toString('hex'),
						address,
					},
				};
			}),
		});
	} catch (e) {
		return err(e);
	}
};

export interface IGetFeeEstimatesResponse {
	fastestFee: number;
	halfHourFee: number;
	hourFee: number;
	minimumFee: number;
}

/**
 * Returns the current fee estimates for the provided network.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<IOnchainFees>}
 */
export const getFeeEstimates = async (
	selectedNetwork?: TAvailableNetworks,
): Promise<IOnchainFees> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}

		if (__DEV__ && selectedNetwork === 'bitcoinRegtest') {
			return defaultFeesShape.onchain;
		}

		const urlModifier = selectedNetwork === 'bitcoin' ? '' : 'testnet/';
		const response = await fetch(
			`https://mempool.space/${urlModifier}api/v1/fees/recommended`,
		);
		const res: IGetFeeEstimatesResponse = await response.json();
		return {
			fast: res.fastestFee,
			normal: res.halfHourFee,
			slow: res.hourFee,
			minimum: res.minimumFee,
			timestamp: Date.now(),
		};
	} catch {
		return defaultFeesShape.onchain;
	}
};

/**
 * Returns the currently selected on-chain fee id (Ex: 'normal').
 * @returns {EFeeId}
 */
export const getSelectedFeeId = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): EFeeId => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const transaction = getOnchainTransactionData({
		selectedWallet,
		selectedNetwork,
	});
	if (transaction.isErr()) {
		return EFeeId.none;
	}
	return transaction.value.selectedFeeId ?? EFeeId.none;
};

/**
 * Returns the amount of sats to send to a given output address in the transaction object by its index.
 * @param selectedWallet
 * @param selectedNetwork
 * @param outputIndex
 */
export const getTransactionOutputAmount = ({
	selectedWallet,
	selectedNetwork,
	outputIndex = 0,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
	outputIndex?: number;
}): Result<number> => {
	const transaction = getOnchainTransactionData({
		selectedWallet,
		selectedNetwork,
	});
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
