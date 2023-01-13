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
		const incomigTxid = await rpc.sendToAddress(
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

		// check addresses
		const addresses = state.wallet.wallets.wallet0.addresses.bitcoinRegtest;

		expect(addresses.p2sh).toHaveProperty(
			'e5c5dbe8c82341872337d56fa52b120e3bac428855d9a450cacf63d15da5c65e',
			{
				address: '2My47gHNc8nhX5kBWqXHU4f8uuQvQKEgwMd',
				path: "m/49'/0'/0'/0/0",
				publicKey:
					'039b3b694b8fc5b5e07fb069c783cac754f5d38c3e08bed1960e31fdb1dda35c24',
				index: 0,
				scriptHash:
					'e5c5dbe8c82341872337d56fa52b120e3bac428855d9a450cacf63d15da5c65e',
			},
		);
		expect(addresses.p2sh).toHaveProperty(
			'fb2e7b1ff6c6a9ba347c23df6ecc0cfae3daa15184125bed0b69ed82a4d736ef',
			{
				address: '2MyKoi3kva7uYJDzv1RmSkbeTkQQ6wBR1ZQ',
				path: "m/49'/0'/0'/0/4",
				publicKey:
					'0315e44fc567dbec14d55491b383334b6ddbcaf9de0aa339481a83feff2a509803',
				index: 4,
				scriptHash:
					'fb2e7b1ff6c6a9ba347c23df6ecc0cfae3daa15184125bed0b69ed82a4d736ef',
			},
		);

		expect(addresses.p2pkh).toHaveProperty(
			'1e8750b8a4c0912d8b84f7eb53472cbdcb57f9e0cde263b2e51ecbe30853cd68',
			{
				address: 'n1M8ZVQtL7QoFvGMg24D6b2ojWvFXCGpoS',
				path: "m/44'/0'/0'/0/0",
				publicKey:
					'03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e',
				index: 0,
				scriptHash:
					'1e8750b8a4c0912d8b84f7eb53472cbdcb57f9e0cde263b2e51ecbe30853cd68',
			},
		);
		expect(addresses.p2pkh).toHaveProperty(
			'895ecf285d41541713a31a26dc1e38406decb98bdf478ac500e4c061dc579ee1',
			{
				address: 'mwGXMMivWNPgie3opNJk6ymE6oHMYrdZeY',
				path: "m/44'/0'/0'/0/4",
				publicKey:
					'029efbcb2db9ee44cb12739e9350e19e5f1ce4563351b770096f0e408f93400c70',
				index: 4,
				scriptHash:
					'895ecf285d41541713a31a26dc1e38406decb98bdf478ac500e4c061dc579ee1',
			},
		);

		expect(addresses.p2wpkh).toHaveProperty(
			'6e4f16236139f15046b38f399a683fb2aa8edf5fd128b3e5db017fb0ac74078a',
			{
				address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
				path: "m/84'/0'/0'/0/0",
				publicKey:
					'0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c',
				index: 0,
				scriptHash:
					'6e4f16236139f15046b38f399a683fb2aa8edf5fd128b3e5db017fb0ac74078a',
			},
		);
		expect(addresses.p2wpkh).toHaveProperty(
			'5828594685d9bb1f63bc0ea44f24d9ca309b419ba49efc756677d363892d33c3',
			{
				address: 'bcrt1qm97vqzgj934vnaq9s53ynkyf9dgr05rat8p3ef',
				path: "m/84'/0'/0'/0/4",
				publicKey:
					'03995137c8eb3b223c904259e9b571a8939a0ec99b0717684c3936407ca8538c1b',
				index: 4,
				scriptHash:
					'5828594685d9bb1f63bc0ea44f24d9ca309b419ba49efc756677d363892d33c3',
			},
		);

		// check addressIndex
		const addressIndex =
			state.wallet.wallets.wallet0.addressIndex.bitcoinRegtest;

		expect(addressIndex.p2sh).toStrictEqual({
			address: '2My47gHNc8nhX5kBWqXHU4f8uuQvQKEgwMd',
			path: "m/49'/0'/0'/0/0",
			publicKey:
				'039b3b694b8fc5b5e07fb069c783cac754f5d38c3e08bed1960e31fdb1dda35c24',
			index: 0,
			scriptHash:
				'e5c5dbe8c82341872337d56fa52b120e3bac428855d9a450cacf63d15da5c65e',
		});

		expect(addressIndex.p2pkh).toStrictEqual({
			address: 'n1M8ZVQtL7QoFvGMg24D6b2ojWvFXCGpoS',
			path: "m/44'/0'/0'/0/0",
			publicKey:
				'03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e',
			index: 0,
			scriptHash:
				'1e8750b8a4c0912d8b84f7eb53472cbdcb57f9e0cde263b2e51ecbe30853cd68',
		});

		expect(addressIndex.p2wpkh).toStrictEqual({
			address: 'bcrt1qnjg0jd8228aq7egyzacy8cys3knf9xvr3v5hfj',
			path: "m/84'/0'/0'/0/1",
			publicKey:
				'03e775fd51f0dfb8cd865d9ff1cca2a158cf651fe997fdc9fee9c1d3b5e995ea77',
			index: 1,
			scriptHash:
				'acb101e9312975c11bd7adc75aa91fed37147214218b7dc0343e54b2e863a482',
		});

		// check addressIndex
		const lastUsedAddressIndex =
			state.wallet.wallets.wallet0.lastUsedAddressIndex.bitcoinRegtest;

		expect(lastUsedAddressIndex.p2sh.index).toEqual(-1);
		expect(lastUsedAddressIndex.p2pkh.index).toEqual(-1);
		expect(lastUsedAddressIndex.p2wpkh.index).toEqual(0);
		expect(lastUsedAddressIndex.p2wpkh.address).toEqual(
			'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
		);

		// check changeAddresses
		const changeAddresses =
			state.wallet.wallets.wallet0.changeAddresses.bitcoinRegtest;

		expect(changeAddresses.p2wpkh).toHaveProperty(
			'48d4bc4257d5177c6a44dfa0e3fd17916fc15b39b8a1cbb0aa297b059f826425',
			{
				address: 'bcrt1q8c6fshw2dlwun7ekn9qwf37cu2rn755ufhry49',
				path: "m/84'/0'/0'/1/0",
				publicKey:
					'03025324888e429ab8e3dbaf1f7802648b9cd01e9b418485c5fa4c1b9b5700e1a6',
				index: 0,
				scriptHash:
					'48d4bc4257d5177c6a44dfa0e3fd17916fc15b39b8a1cbb0aa297b059f826425',
			},
		);
		expect(changeAddresses.p2wpkh).toHaveProperty(
			'0c325f0eb65ae59e75125ee3a823f408e469002e840c670cf5eba33270497028',
			{
				address: 'bcrt1qetrkzfslk0d4kqjnu29fdh04tkav9vj377cjsd',
				path: "m/84'/0'/0'/1/4",
				publicKey:
					'02a8dee7573bcc7d3c1e9b9e267dbf0cd717343c31d322c5b074a3a97090a0d952',
				index: 4,
				scriptHash:
					'0c325f0eb65ae59e75125ee3a823f408e469002e840c670cf5eba33270497028',
			},
		);

		// check changeAddressIndex
		const changeAddressIndex =
			state.wallet.wallets.wallet0.changeAddressIndex.bitcoinRegtest;

		expect(changeAddressIndex.p2wpkh).toStrictEqual({
			address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
			path: "m/84'/0'/0'/0/0",
			publicKey:
				'0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c',
			index: 0,
			scriptHash:
				'6e4f16236139f15046b38f399a683fb2aa8edf5fd128b3e5db017fb0ac74078a',
		});

		// check utxos
		const utxos = state.wallet.wallets.wallet0.utxos.bitcoinRegtest;
		// wallet UTXO should have input with new txid
		const newOutput = utxos.find((o) => {
			return (
				o.address === 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx' &&
				o.tx_hash === incomigTxid
			);
		});
		expect(newOutput).toBeDefined();

		// check transactions
		const transactions =
			state.wallet.wallets.wallet0.transactions.bitcoinRegtest;

		expect(transactions).toHaveProperty(
			incomigTxid,
			expect.objectContaining({
				address: 'bcrt1qcr8te4kr609gcawutmrza0j4xv80jy8zeqchgx',
				matchedOutputValue: 1,
				satsPerByte: 1,
				type: 'received',
				value: 1,
				txid: incomigTxid,
			}),
		);
	});
});
