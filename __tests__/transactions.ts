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

		updateWallet({ wallets: { wallet0: walletState } });

		await setupOnChainTransaction({ selectedNetwork });
	});

	it('Creates an on chain transaction from the transaction store', async () => {
		const selectedWallet = getSelectedWallet();

		updateBitcoinTransaction({
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
			'020000000001020c0eab3149ba3ed7abd8f4c98eabe2cbb2b7c3590404b66ca0f01addf61ec67100000000000000000051bd848851cadb71bf34e6e0e46b0c4214c2d06ccc1d5ca0f5baefdcf862692000000000000000000002112700000000000017a9147a40d326e4de19353e2bf8b3f15b395c88b2d241876ecd010000000000160014669a9323418693b81d44c19da7b1fe7911b2142902483045022100e5bf3be5b8626fc72447cee78684416b8e23b905087c8dfadb69732124fd5ba6022021fa2fe097afde801ae0495f95a11b0bfc8273804b88ed63861d72a16548593101210318cb16a8e659f378002e75abe93f064c4ebcd62576bc15019281b635f96840a802483045022100ab9a47bf65d5855e19badaf60b6e74e454b3bcc0af3c7f465b32070a06781b920220336169c94789a4a17b6e22f9a094f3775da96c82f9c4ac57ebcea8e90885bf16012102bb6083f2571ecd26f68edeae341c0700463349a84b2044c271e061e813e0cd0300000000',
		);

		expect(res.value.id).toEqual(
			'4155049f78ff36c13dd9ca4c657799600115579a86bb465601ec8ca0af9f6982',
		);
	});
});
