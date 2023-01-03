import {
	createWallet,
	setupOnChainTransaction,
	updateBitcoinTransaction,
	updateWallet,
} from '../src/store/actions/wallet';
import { getSelectedWallet } from '../src/utils/wallet';
import { TAvailableNetworks } from '../src/utils/networks';
import { mnemonic, walletState } from './utils/dummy-wallet';
import { createTransaction } from '../src/utils/wallet/transactions';

const selectedNetwork: TAvailableNetworks = 'bitcoinTestnet';

describe('On chain transactions', () => {
	beforeAll(async () => {
		require('../nodejs-assets/nodejs-project/main.js');

		//Seed wallet data including utxo and transaction data
		await createWallet({
			mnemonic,
			addressAmount: 5,
			changeAddressAmount: 5,
			selectedNetwork,
		});

		await updateWallet({ wallets: { wallet0: walletState } });

		await setupOnChainTransaction({ selectedNetwork });
	});

	it('Creates an on chain transaction from the transaction store', async () => {
		const selectedWallet = getSelectedWallet();

		await updateBitcoinTransaction({
			selectedNetwork,
			selectedWallet,
			transaction: {
				rbf: true,
				outputs: [
					{
						value: 10001,
						index: 0,
						address: '2N4Pe5o1sZKcXdYC3JVVeJKMXCmEZgVEQFa',
					},
				],
			},
		});

		const res = await createTransaction({
			selectedNetwork,
			selectedWallet,
		});

		if (res.isErr()) {
			expect(res.error.message).toEqual('');
			return;
		}

		expect(res.value.hex).toEqual(
			'020000000001020c0eab3149ba3ed7abd8f4c98eabe2cbb2b7c3590404b66ca0f01addf61ec67100000000000000000051bd848851cadb71bf34e6e0e46b0c4214c2d06ccc1d5ca0f5baefdcf862692000000000000000000002112700000000000017a9147a40d326e4de19353e2bf8b3f15b395c88b2d24187bdcc010000000000160014669a9323418693b81d44c19da7b1fe7911b2142902483045022100f178c62e0e334a510bcc7c8c29d7b9d5baf38f0b07139c3666dda7fb7b2fd06e022058191a429d4495e7d38636999903d86aba009e8411540bbc70631edda500bb9601210318cb16a8e659f378002e75abe93f064c4ebcd62576bc15019281b635f96840a802473044022003053bcfffd23ccae537cc7a6934e923deddafcb7a18cd72ac6e3e391bf78b7602202c4d4c15dcdd23cbd583780712e6b71f993af0c21f23faf28fae207d70a3debd012102bb6083f2571ecd26f68edeae341c0700463349a84b2044c271e061e813e0cd0300000000',
		);

		expect(res.value.id).toEqual(
			'd4bb9e84533e8dffe3b6985c1220fd8a9f7f88aa83ae45907c7703b05fa99b2c',
		);
	});
});
