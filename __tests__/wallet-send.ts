import BitcoinJsonRpc from 'bitcoin-json-rpc';
import * as electrum from 'rn-electrum-client/helpers';

import store from '../src/store';
import { createNewWallet, startWalletServices } from '../src/utils/startup';
import {
	updateAddressIndexes,
	updateWallet,
	updateBitcoinTransaction,
	setupOnChainTransaction,
	resetOnChainTransaction,
} from '../src/store/actions/wallet';
import { connectToElectrum } from '../src/utils/wallet/electrum';
import {
	broadcastTransaction,
	createTransaction,
	sendMax,
	updateFee,
	validateTransaction,
} from '../src/utils/wallet/transactions';
import { addElectrumPeer } from '../src/store/actions/settings';
import { getScriptHash } from '../src/utils/wallet';
import initWaitForElectrumToSync from './utils/wait-for-electrum';

jest.setTimeout(60_000);

const bitcoinURL =
	'http://electrumx:1VmSUVGBuLNWvZl0LExRDW0tvl6196-47RfXIzS384g=@localhost:43782';

describe('Wallet - new wallet, send and receive', () => {
	let waitForElectrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		require('../nodejs-assets/nodejs-project/main.js');

		// Mine at least 10 Bitcoins before each test
		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}

		waitForElectrum = await initWaitForElectrumToSync(
			{ port: 60001, host: '127.0.0.1' },
			bitcoinURL,
		);
	});

	afterAll(async () => {
		await electrum.stop({ network: 'bitcoinRegtest' });
	});

	it('Can generate new wallet, receive and send funds', async () => {
		// Testplan:
		// 0 create new wallet
		// 1 create send transaction, rbf disabled
		// 2 create send max transaction, rbf enabled
		// 3 validate transactions and activity stores

		// create wallet
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}

		expect(res.value).toEqual('Wallet created');

		// switch to regtest
		await updateWallet({ selectedNetwork: 'bitcoinRegtest' });
		expect(store.getState().wallet.selectedNetwork).toEqual('bitcoinRegtest');

		res = await addElectrumPeer({
			peer: { host: '127.0.0.1', ssl: 60002, tcp: 60001, protocol: 'tcp' },
		});
		if (res.isErr()) {
			throw res.error;
		}

		res = await connectToElectrum();
		if (res.isErr()) {
			throw res.error;
		}

		res = await updateAddressIndexes();
		if (res.isErr()) {
			throw res.error;
		}

		// rescan to generate addresses
		res = await startWalletServices({ lightning: false, restore: true });
		if (res.isErr()) {
			throw res.error;
		}

		const addressIndex1 =
			store.getState().wallet.wallets.wallet0.addressIndex.bitcoinRegtest
				.p2wpkh;

		expect(addressIndex1.path).toBe("m/84'/0'/0'/0/0");
		expect(addressIndex1.index).toBe(0);
		expect(addressIndex1.address).toBeDefined();

		// send some funds to wallet address
		await rpc.sendToAddress(addressIndex1.address, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		// rescan to fetch new UTXO
		res = await startWalletServices({ lightning: false, restore: true });
		if (res.isErr()) {
			throw res.error;
		}

		const addressIndex2 =
			store.getState().wallet.wallets.wallet0.addressIndex.bitcoinRegtest
				.p2wpkh;

		// addressIndex should be updated
		expect(addressIndex2.path).toBe("m/84'/0'/0'/0/1");
		expect(addressIndex2.index).toBe(1);
		expect(addressIndex2.address).toBeDefined();

		// ** TRANSACION 1: send 0.5 BTC to new address with fee 3 vsat/byte **

		const receivingAddress1 = await rpc.getNewAddress();

		// setup transaction
		const res2 = await setupOnChainTransaction();
		if (res2.isErr()) {
			throw res2.error;
		}

		const tx11 =
			store.getState().wallet.wallets.wallet0.transaction.bitcoinRegtest;
		expect(tx11?.inputs?.length).toBe(1);
		expect(tx11?.changeAddress).toBeDefined();
		expect(tx11?.rbf).toBe(false);
		expect(tx11?.satsPerByte).toBe(2);

		// set address and amount
		res = await updateBitcoinTransaction({
			transaction: {
				outputs: [{ address: receivingAddress1, value: 50_000_000, index: 0 }],
			},
		});
		if (res.isErr()) {
			throw res.error;
		}

		const tx12 =
			store.getState().wallet.wallets.wallet0.transaction.bitcoinRegtest;
		expect(tx12?.outputs?.[0].address).toBe(receivingAddress1);
		expect(tx12?.satsPerByte).toBe(2);

		// setting fee too high should return an error
		res = updateFee({ satsPerByte: 100_000_000, transaction: tx12 });
		// @ts-ignore
		expect(res.error.message).toBe(
			'Unable to increase the fee any further. Otherwise, it will exceed half the current balance.',
		);

		// set fee to 3 vsat/byte
		res = updateFee({ satsPerByte: 3, transaction: tx12 });
		if (res.isErr()) {
			throw res.error;
		}

		const tx13 =
			store.getState().wallet.wallets.wallet0.transaction.bitcoinRegtest;
		expect(tx13.satsPerByte).toBe(3);
		expect(tx13.fee).toBe(423);

		res = validateTransaction(tx13);
		if (res.isErr()) {
			throw res.error;
		}

		const res3 = await createTransaction();
		if (res3.isErr()) {
			throw res3.error;
		}
		expect(res3.value.id).toBeDefined();
		expect(res3.value.hex).toBeDefined();

		// TODO: use rpc.createrawtransaction() to analyze tx hex

		res = await broadcastTransaction({ rawTx: res3.value.hex });
		if (res.isErr()) {
			throw res.error;
		}

		await rpc.generateToAddress(4, await rpc.getNewAddress());
		await waitForElectrum();

		// check if tx has been confirmed and receiving address now has 0.5 BTC balance
		const scriptHash1 = await getScriptHash(receivingAddress1);
		const balance1 = await electrum.getAddressScriptHashBalance({
			scriptHash: scriptHash1,
			network: 'bitcoinRegtest',
		});
		expect(balance1.data.confirmed).toEqual(50_000_000);

		const txs1 = await electrum.getTransactions({
			txHashes: [res3.value.id],
			network: 'bitcoinRegtest',
		});
		expect(txs1.data[0].result.txid).toEqual(res3.value.id);
		expect(txs1.data[0].result.vin.length).toEqual(1);
		expect(txs1.data[0].result.vout.length).toEqual(2);

		// TODO check rbf flag = false

		// rescan to update the wallet state
		res = await startWalletServices({ lightning: false, restore: true });
		if (res.isErr()) {
			throw res.error;
		}
		expect(
			store.getState().wallet.wallets.wallet0.balance.bitcoinRegtest,
		).toBeLessThan(100_000_000);

		// ** TRANSACION 2: send 0.5 BTC to new address with fee 1 vsat/byte **

		const receivingAddress2 = await rpc.getNewAddress();

		// setup new transaction
		res = await resetOnChainTransaction();
		if (res.isErr()) {
			throw res.error;
		}
		const res4 = await setupOnChainTransaction();
		if (res4.isErr()) {
			throw res4.error;
		}

		// set address and amount
		res = await updateBitcoinTransaction({
			transaction: {
				outputs: [{ address: receivingAddress2, value: 50_000_000, index: 0 }],
				rbf: true,
			},
		});

		res = await sendMax();
		if (res.isErr()) {
			throw res.error;
		}

		const tx21 =
			store.getState().wallet.wallets.wallet0.transaction.bitcoinRegtest;
		expect(tx21?.rbf).toEqual(true);

		// sending amount + fee should be equeal to the balance
		expect((tx21?.outputs?.[0].value ?? 0) + (tx21?.fee ?? 0)).toBe(
			store.getState().wallet.wallets.wallet0.balance.bitcoinRegtest,
		);

		// TODO check change fee logic while sending MAX amount

		res = validateTransaction(tx21);
		if (res.isErr()) {
			throw res.error;
		}

		const res5 = await createTransaction();
		if (res5.isErr()) {
			throw res5.error;
		}
		expect(res5.value.id).toBeDefined();
		expect(res5.value.hex).toBeDefined();

		res = await broadcastTransaction({ rawTx: res5.value.hex });
		if (res.isErr()) {
			throw res.error;
		}

		await rpc.generateToAddress(4, await rpc.getNewAddress());
		await waitForElectrum();

		// check if tx has been confirmed and receiving address now has some balance
		const scriptHash2 = await getScriptHash(receivingAddress2);
		const balance2 = await electrum.getAddressScriptHashBalance({
			scriptHash: scriptHash2,
			network: 'bitcoinRegtest',
		});
		expect(balance2.data.confirmed).toEqual(tx21?.outputs?.[0].value);

		const txs2 = await electrum.getTransactions({
			txHashes: [res5.value.id],
			network: 'bitcoinRegtest',
		});
		expect(txs2.data[0].result.txid).toEqual(res5.value.id);
		expect(txs2.data[0].result.vin.length).toEqual(1);
		expect(txs2.data[0].result.vout.length).toEqual(1);

		// TODO check rbf flag = true

		// rescan to update the wallet state
		res = await startWalletServices({ lightning: false, restore: true });
		if (res.isErr()) {
			throw res.error;
		}

		// we spent everything, balance should be 0
		expect(store.getState().wallet.wallets.wallet0.balance.bitcoinRegtest).toBe(
			0,
		);
	});
});
