import * as bitcoin from 'bitcoinjs-lib';

type Transaction = bitcoin.Transaction;
type Network = bitcoin.Network;
type TxOutput = bitcoin.TxOutput;

type Format = {
	txid: string;
	version: number;
	locktime: number;
};

const decodeFormat = (tx: Transaction): Format => {
	return {
		txid: tx.getId(),
		version: tx.version,
		locktime: tx.locktime,
	};
};

type Input = {
	txid: string;
	n: number;
	script: string;
	sequence: number;
};

const decodeInput = (tx: Transaction): Input[] => {
	return tx.ins.map((input) => ({
		txid: input.hash.reverse().toString('hex'),
		n: input.index,
		script: bitcoin.script.toASM(input.script),
		sequence: input.sequence,
	}));
};

type PaymentFn = (
	a: bitcoin.Payment,
	opts?: bitcoin.PaymentOpts,
) => bitcoin.Payment;

// this is replacement for missing bitcoin.script.classifyOutput
const classifyOutputScript = (script): string => {
	const isOutput = (paymentFn: PaymentFn): bitcoin.Payment | undefined => {
		try {
			return paymentFn({ output: script });
		} catch (e) {}
	};

	if (isOutput(bitcoin.payments.p2pk)) {
		return 'pubkey';
	}
	if (isOutput(bitcoin.payments.p2pkh)) {
		return 'pubkeyhash';
	}
	if (isOutput(bitcoin.payments.p2ms)) {
		return 'multisig';
	}
	if (isOutput(bitcoin.payments.p2wpkh)) {
		return 'pay-to-witness-pubkey-hash';
	}
	if (isOutput(bitcoin.payments.p2sh)) {
		return 'scripthash';
	}
	if (isOutput(bitcoin.payments.p2tr)) {
		return 'pay-to-taproot';
	}

	return 'nonstandard';
};

type VOut = {
	satoshi: number;
	value: string;
	n: number;
	scriptPubKey: {
		asm: string;
		hex: string;
		type: string;
		addresses: string[];
	};
};

const formatOutput = (out: TxOutput, n: number, network: Network): VOut => {
	const vout: VOut = {
		satoshi: out.value,
		value: (1e-8 * out.value).toFixed(8),
		n: n,
		scriptPubKey: {
			asm: bitcoin.script.toASM(out.script),
			hex: out.script.toString('hex'),
			type: classifyOutputScript(out.script),
			addresses: [],
		},
	};
	switch (vout.scriptPubKey.type) {
		case 'pubkeyhash':
		case 'pubkey':
		case 'multisig':
		case 'pay-to-witness-pubkey-hash':
		case 'pay-to-taproot':
		case 'scripthash': {
			const address = bitcoin.address.fromOutputScript(out.script, network);
			vout.scriptPubKey.addresses.push(address);
			break;
		}
	}
	return vout;
};

const decodeOutput = (tx: Transaction, network: Network): VOut[] => {
	return tx.outs.map((out, n) => formatOutput(out, n, network));
};

type Result = {
	txid: string;
	version: number;
	locktime: number;
	inputs: Input[];
	outputs: VOut[];
};

export const decodeRawTx = (rawTx: string, network: Network): Result => {
	const tx = bitcoin.Transaction.fromHex(rawTx);
	const format = decodeFormat(tx);
	const inputs = decodeInput(tx);
	const outputs = decodeOutput(tx, network);

	const result = {} as Result;
	for (const key of Object.keys(format)) {
		result[key] = format[key];
	}
	result.inputs = inputs;
	result.outputs = outputs;
	return result;
};
