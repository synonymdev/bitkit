import BitcoinJsonRpc from 'bitcoin-json-rpc';
import * as electrum from 'rn-electrum-client/helpers';

import store from '../src/store';
import { restoreSeed, startWalletServices } from '../src/utils/startup';
import {
	updateAddressIndexes,
	updateWallet,
} from '../src/store/actions/wallet';
import { connectToElectrum } from '../src/utils/wallet/electrum';
import { addElectrumPeer } from '../src/store/actions/settings';
import initWaitForElectrumToSync from './utils/wait-for-electrum';

jest.setTimeout(60_000);

const bitcoinURL =
	'http://electrumx:1VmSUVGBuLNWvZl0LExRDW0tvl6196-47RfXIzS384g=@localhost:43782';

describe('Wallet - wallet restore and receive', () => {
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

	it("can restore wallet and it's balance", async () => {
		// send some bitcoin to wallet address
		await rpc.sendToAddress(
			'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx', // scriptHash: 6e4f16236139f15046b38f399a683fb2aa8edf5fd128b3e5db017fb0ac74078a
			'1',
		);
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		// restore wallet
		let res = await restoreSeed({
			mnemonic:
				'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
		});
		if (res.isErr()) {
			throw res.error;
		}

		expect(res.value).toEqual('Seed restored');
		expect(store.getState().wallet.selectedNetwork).toEqual('bitcoin');
		expect(store.getState().wallet.selectedWallet).toEqual('wallet0');

		// switch to regtest
		updateWallet({ selectedNetwork: 'bitcoinRegtest' });
		expect(store.getState().wallet.selectedNetwork).toEqual('bitcoinRegtest');

		res = await addElectrumPeer({
			peer: { host: '127.0.0.1', ssl: 60002, tcp: 60001, protocol: 'tcp' },
		});
		if (res.isErr()) {
			throw res.error;
		}

		res = await connectToElectrum({});
		if (res.isErr()) {
			throw res.error;
		}

		res = await updateAddressIndexes({});
		if (res.isErr()) {
			throw res.error;
		}

		// rescan
		res = await startWalletServices({ lightning: false, restore: true });
		if (res.isErr()) {
			throw res.error;
		}

		const state = store.getState();
		expect(state.wallet.selectedNetwork).toEqual('bitcoinRegtest');
		expect(state.wallet.selectedWallet).toEqual('wallet0');
		expect(
			state.wallet.wallets.wallet0.balance.bitcoinRegtest,
		).toBeGreaterThanOrEqual(1);
	});
});
