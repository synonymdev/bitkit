import BitcoinJsonRpc from 'bitcoin-json-rpc';

import '../src/utils/i18n';
import store from '../src/store';
import { restoreSeed } from '../src/utils/startup';
import { EAvailableNetworks, EProtocol } from 'beignet';
import { getOnChainWallet } from '../src/utils/wallet';
import initWaitForElectrumToSync from './utils/wait-for-electrum';
import { EAvailableNetwork } from '../src/utils/networks';

jest.setTimeout(60_000);

const electrumHost = '127.0.0.1';
const electrumPort = 60001;
const bitcoinURL = 'http://polaruser:polarpass@127.0.0.1:43782';
const selectedNetwork = EAvailableNetwork.bitcoinRegtest;

describe('Wallet - wallet restore and receive', () => {
	let waitForElectrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		// Mine at least 10 Bitcoins before each test
		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}
		waitForElectrum = await initWaitForElectrumToSync(
			{ host: electrumHost, port: electrumPort },
			bitcoinURL,
		);
	});

	it("can restore wallet and it's balance", async () => {
		// send some bitcoin to wallet address
		const incomigTxid = await rpc.sendToAddress(
			'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk', // scriptHash: 71d53db103b8dedac12267edc183a38240654842bc98fd9776515a86a84f9590
			'1',
		);
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		const servers = [
			{
				host: electrumHost,
				ssl: electrumPort,
				tcp: electrumPort,
				protocol: EProtocol.tcp,
			},
		];
		// restore wallet
		let res = await restoreSeed({
			mnemonic:
				'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
			selectedNetwork,
			servers,
		});
		if (res.isErr()) {
			throw res.error;
		}

		expect(res.value).toEqual('Seed restored');
		expect(store.getState().wallet.selectedWallet).toEqual('wallet0');
		const state = store.getState();
		const wallet = getOnChainWallet();

		expect(wallet.network).toEqual(EAvailableNetworks.bitcoinRegtest);
		expect(wallet.name).toEqual('wallet0');
		const selectedWallet = state.wallet.selectedWallet;

		expect(
			state.wallet.wallets[selectedWallet].addressIndex[selectedNetwork].p2wpkh
				.address,
		).toEqual('bcrt1qd7spv5q28348xl4myc8zmh983w5jx32cs707jh');
		expect(wallet.data.addressIndex.p2wpkh.address).toEqual(
			'bcrt1qd7spv5q28348xl4myc8zmh983w5jx32cs707jh',
		);
		expect(state.wallet.selectedWallet).toEqual('wallet0');
		expect(wallet.data.balance).toBeGreaterThanOrEqual(1);

		// check addresses
		const addresses = state.wallet.wallets.wallet0.addresses.bitcoinRegtest;

		expect(addresses.p2sh).toHaveProperty(
			'fe50ad3261e3c01e61a107f40ae7d762b1e276721c803cc4aee55187effe6d7f',
			{
				address: '2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2',
				index: 0,
				path: "m/49'/1'/0'/0/0",
				publicKey:
					'03a1af804ac108a8a51782198c2d034b28bf90c8803f5a53f76276fa69a4eae77f',
				scriptHash:
					'fe50ad3261e3c01e61a107f40ae7d762b1e276721c803cc4aee55187effe6d7f',
			},
		);
		expect(addresses.p2sh).toHaveProperty(
			'37748c721f575a9bfe5ab2b545ef59af417bac2e73a625420fe79bec134ce06e',
			{
				address: '2MuKeQzUHhUQWUZgx5AuNWoQ7YWx6vsXxrv',
				index: 4,
				path: "m/49'/1'/0'/0/4",
				publicKey:
					'03765505df9cc00d2cd578c961a494214402283b9f6e8f28684e8798862057a02b',
				scriptHash:
					'37748c721f575a9bfe5ab2b545ef59af417bac2e73a625420fe79bec134ce06e',
			},
		);

		expect(addresses.p2pkh).toHaveProperty(
			'62e79b96e30507526450ca144ceeca7b90954acbd641f3de50ba1191c292af9a',
			{
				address: 'mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV',
				index: 0,
				path: "m/44'/1'/0'/0/0",
				publicKey:
					'02a7451395735369f2ecdfc829c0f774e88ef1303dfe5b2f04dbaab30a535dfdd6',
				scriptHash:
					'62e79b96e30507526450ca144ceeca7b90954acbd641f3de50ba1191c292af9a',
			},
		);
		expect(addresses.p2pkh).toHaveProperty(
			'a75838b21cbcab06b8c2c469a165778a50d126dc07ed23bcc562e375a07b11ba',
			{
				address: 'n2BMo5arHDyAK2CM8c56eoEd18uEkKnRLC',
				index: 4,
				path: "m/44'/1'/0'/0/4",
				publicKey:
					'02b9988be7219be78b82e659155d02d3e1462f3febe7c87d33964b37831efd8884',
				scriptHash:
					'a75838b21cbcab06b8c2c469a165778a50d126dc07ed23bcc562e375a07b11ba',
			},
		);

		expect(addresses.p2wpkh).toHaveProperty(
			'71d53db103b8dedac12267edc183a38240654842bc98fd9776515a86a84f9590',
			{
				address: 'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk',
				index: 0,
				path: "m/84'/1'/0'/0/0",
				publicKey:
					'02e7ab2537b5d49e970309aae06e9e49f36ce1c9febbd44ec8e0d1cca0b4f9c319',
				scriptHash:
					'71d53db103b8dedac12267edc183a38240654842bc98fd9776515a86a84f9590',
			},
		);
		expect(addresses.p2wpkh).toHaveProperty(
			'796e84f36cdb86f770d555b0decf619ce87e5e0f3b783b6a3acff33801a18457',
			{
				address: 'bcrt1q677973lw0w796gttpy52f296jqaaksz0kadvlr',
				index: 4,
				path: "m/84'/1'/0'/0/4",
				publicKey:
					'03bb5db212192d5b428c5db726aba21426d0a63b7a453b0104f2398326bca43fc2',
				scriptHash:
					'796e84f36cdb86f770d555b0decf619ce87e5e0f3b783b6a3acff33801a18457',
			},
		);

		// check addressIndex
		const addressIndex =
			state.wallet.wallets.wallet0.addressIndex.bitcoinRegtest;

		expect(addressIndex.p2sh).toStrictEqual({
			address: '2Mww8dCYPUpKHofjgcXcBCEGmniw9CoaiD2',
			path: "m/49'/1'/0'/0/0",
			publicKey:
				'03a1af804ac108a8a51782198c2d034b28bf90c8803f5a53f76276fa69a4eae77f',
			index: 0,
			scriptHash:
				'fe50ad3261e3c01e61a107f40ae7d762b1e276721c803cc4aee55187effe6d7f',
		});

		expect(addressIndex.p2pkh).toStrictEqual({
			address: 'mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV',
			path: "m/44'/1'/0'/0/0",
			publicKey:
				'02a7451395735369f2ecdfc829c0f774e88ef1303dfe5b2f04dbaab30a535dfdd6',
			index: 0,
			scriptHash:
				'62e79b96e30507526450ca144ceeca7b90954acbd641f3de50ba1191c292af9a',
		});

		expect(addressIndex.p2wpkh).toStrictEqual({
			address: 'bcrt1qd7spv5q28348xl4myc8zmh983w5jx32cs707jh',
			path: "m/84'/1'/0'/0/1",
			publicKey:
				'03eeed205a69022fed4a62a02457f3699b19c06bf74bf801acc6d9ae84bc16a9e1',
			index: 1,
			scriptHash:
				'fb51113b012a2eb8b8157ed8336ef31aa669993372bd5a0e712004989eee044b',
		});

		// check addressIndex
		const lastUsedAddressIndex =
			state.wallet.wallets.wallet0.lastUsedAddressIndex.bitcoinRegtest;

		expect(lastUsedAddressIndex.p2sh.index).toEqual(-1);
		expect(lastUsedAddressIndex.p2pkh.index).toEqual(-1);
		expect(lastUsedAddressIndex.p2wpkh.index).toEqual(0);
		expect(lastUsedAddressIndex.p2wpkh.address).toEqual(
			'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk',
		);

		// check changeAddresses
		const changeAddresses =
			state.wallet.wallets.wallet0.changeAddresses.bitcoinRegtest;

		expect(changeAddresses.p2wpkh).toHaveProperty(
			'bb913937bc604ebdb5538198d85c5ea211a88926d36926ecf0800ecc507d0fcc',
			{
				address: 'bcrt1q9u62588spffmq4dzjxsr5l297znf3z6jkgnhsw',
				index: 0,
				path: "m/84'/1'/0'/1/0",
				publicKey:
					'035d49eccd54d0099e43676277c7a6d4625d611da88a5df49bf9517a7791a777a5',
				scriptHash:
					'bb913937bc604ebdb5538198d85c5ea211a88926d36926ecf0800ecc507d0fcc',
			},
		);
		expect(changeAddresses.p2wpkh).toHaveProperty(
			'a012aa15544d67973b9fef1bf3852b246cf44dc18dadd23c3325c9e4a7ced949',
			{
				address: 'bcrt1qw3xfnyuspj8qnr2envc448mxwam7f7p249rqs0',
				index: 4,
				path: "m/84'/1'/0'/1/4",
				publicKey:
					'02e6c60079372951c3024a033ecf6584579ebf2f7927ae99c42633e805596f2935',
				scriptHash:
					'a012aa15544d67973b9fef1bf3852b246cf44dc18dadd23c3325c9e4a7ced949',
			},
		);

		// check changeAddressIndex
		const changeAddressIndex =
			state.wallet.wallets.wallet0.changeAddressIndex.bitcoinRegtest;

		expect(changeAddressIndex.p2wpkh).toStrictEqual({
			address: 'bcrt1q9u62588spffmq4dzjxsr5l297znf3z6jkgnhsw',
			path: "m/84'/1'/0'/1/0",
			publicKey:
				'035d49eccd54d0099e43676277c7a6d4625d611da88a5df49bf9517a7791a777a5',
			index: 0,
			scriptHash:
				'bb913937bc604ebdb5538198d85c5ea211a88926d36926ecf0800ecc507d0fcc',
		});

		// check utxos
		const utxos = wallet.data.utxos;
		// wallet UTXO should have input with new txid
		const newOutput = utxos.find((o) => {
			return (
				o.address === 'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk' &&
				o.tx_hash === incomigTxid
			);
		});
		expect(newOutput).toBeDefined();

		// check transactions
		const transactions = wallet.data.transactions;

		expect(transactions).toHaveProperty(
			incomigTxid,
			expect.objectContaining({
				address: 'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk',
				matchedOutputValue: 1,
				satsPerByte: 1,
				type: 'received',
				value: 1,
				txid: incomigTxid,
			}),
		);
	});
});
