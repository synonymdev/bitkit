import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';
import { TChannel } from '@synonymdev/react-native-ldk';

import '../src/utils/i18n';
import store from '../src/store';
import Store from '../src/store/types';
import { createNewWallet } from '../src/utils/startup';
import { updateWallet } from '../src/store/actions/wallet';
import { balanceSelector } from '../src/store/reselect/aggregations';

describe('Reselect', () => {
	describe('balanceSelector', () => {
		let s: Store;

		beforeAll(async () => {
			require('../nodejs-assets/nodejs-project/main.js');
			let res = await createNewWallet();
			if (res.isErr()) {
				throw res.error;
			}
			updateWallet({ selectedNetwork: 'bitcoinRegtest' });
			s = store.getState();
		});

		it('should return zeros by default', () => {
			const state = cloneDeep(s);
			assert.deepEqual(balanceSelector(state), {
				lightningBalance: 0,
				lightningClaimableBalance: 0,
				lightningReserveBalance: 0,
				lightningSpendingBalance: 0,
				onchainBalance: 0,
				totalBalance: 0,
				totalSpendableBalance: 0,
			});
		});

		it('should return onchain balance for current wallet', () => {
			const state = cloneDeep(s);
			state.wallet.wallets.wallet0.balance.bitcoinRegtest = 1;
			assert.deepEqual(balanceSelector(state), {
				lightningBalance: 0,
				lightningClaimableBalance: 0,
				lightningReserveBalance: 0,
				lightningSpendingBalance: 0,
				onchainBalance: 1,
				totalBalance: 1,
				totalSpendableBalance: 1,
			});
		});

		it('should calculate balance for LN wallet', () => {
			const state = cloneDeep(s);
			state.wallet.wallets.wallet0.balance.bitcoinRegtest = 1;

			const channel1 = {
				channel_id: 'channel1',
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2
			} as TChannel;
			const channel2 = {
				channel_id: 'channel2',
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2
			} as TChannel;
			const channel3 = {
				channel_id: 'channel3',
				is_channel_ready: false,
				outbound_capacity_sat: 1,
				balance_sat: 2
			} as TChannel;

			const lnWallet = state.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1, channel2, channel3 };
			lnWallet.openChannelIds.bitcoinRegtest = ['channel1', 'channel2', 'channel3'];
			lnWallet.claimableBalance.bitcoinRegtest = 3;

			assert.deepEqual(balanceSelector(state), {
				lightningBalance: 7,
				lightningClaimableBalance: 3,
				lightningReserveBalance: 2,
				lightningSpendingBalance: 2,
				onchainBalance: 1,
				totalBalance: 8,
				totalSpendableBalance: 3,
			});
		});

	});
});
