import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';

import '../src/utils/i18n';
import store, { RootState } from '../src/store';
import { createNewWallet } from '../src/utils/startup';
import { updateWallet } from '../src/store/actions/wallet';
import { EAvailableNetwork } from '../src/utils/networks';
import {
	balanceSelector,
	lnSetupSelector,
} from '../src/store/reselect/aggregations';
import { TChannel, EChannelStatus } from '../src/store/types/lightning';

describe('Reselect', () => {
	let s: RootState;

	beforeAll(async () => {
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		updateWallet({ selectedNetwork: EAvailableNetwork.bitcoinRegtest });
		s = store.getState();
	});

	describe('balanceSelector', () => {
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
				status: EChannelStatus.open,
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;
			const channel2 = {
				channel_id: 'channel2',
				status: EChannelStatus.open,
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;
			const channel3 = {
				channel_id: 'channel3',
				status: EChannelStatus.closed,
				is_channel_ready: false,
				outbound_capacity_sat: 1,
				balance_sat: 2,
				claimable_balances: [
					{ amount_satoshis: 3, type: 'ClaimableOnChannelClose' },
				],
			} as TChannel;

			const lnWallet = state.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1, channel2, channel3 };

			assert.deepEqual(balanceSelector(state), {
				lightningBalance: 4,
				lightningClaimableBalance: 3,
				lightningReserveBalance: 2,
				lightningSpendingBalance: 2,
				onchainBalance: 1,
				totalBalance: 5,
				totalSpendableBalance: 3,
			});
		});
	});

	describe('lnSetupSelector', () => {
		it('should calculate percentage corectly', () => {
			const state = cloneDeep(s);
			// balance under maxChannelSizeSat
			state.wallet.wallets.wallet0.balance.bitcoinRegtest = 20000;

			expect(lnSetupSelector(state, 0)).toMatchObject({
				percentage: {
					savings: 100,
					spendings: 0,
				},
				canContinue: false,
			});

			expect(lnSetupSelector(state, 10000)).toMatchObject({
				percentage: {
					savings: 50,
					spendings: 50,
				},
				canContinue: true,
			});

			expect(lnSetupSelector(state, 16000)).toMatchObject({
				percentage: {
					savings: 20,
					spendings: 80,
				},
				canContinue: true,
			});
		});

		it('should calculate client balance limits without LN channels', () => {
			// max value is limited by btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * DIFF
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};

			const received1 = lnSetupSelector(s1, 0);
			const expected1 = {
				slider: {
					startValue: 0,
					maxValue: 98,
					endValue: 1000,
				},
				limits: {
					local: 800,
					lsp: 98,
				},
				initialClientBalance: 98,
			};

			expect(received1).toMatchObject(expected1);

			// max value is limited by onchain balance
			const s2 = cloneDeep(s);
			s2.wallet.wallets.wallet0.balance.bitcoinRegtest = 50;
			s2.blocktank.info.options = {
				...s2.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};

			const received2 = lnSetupSelector(s2, 0);
			const expected2 = {
				slider: {
					startValue: 0,
					maxValue: 40,
					endValue: 50,
				},
				limits: {
					local: 40,
					lsp: 98,
				},
				initialClientBalance: 10,
			};

			expect(received2).toMatchObject(expected2);
		});

		it('should calculate client balance limits with existing LN channels', () => {
			// max value is limited by leftover node capacity
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
			};
			const channel1 = {
				channel_id: 'channel1',
				status: EChannelStatus.open,
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
				channel_value_satoshis: 100,
			} as TChannel;
			const lnWallet = s1.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1 };

			const received1 = lnSetupSelector(s1, 20);
			const expected1 = {
				slider: {
					startValue: 0,
					maxValue: 51,
					endValue: 1002,
				},
				limits: {
					local: 802,
					lsp: 51,
				},
				initialClientBalance: 2,
				canContinue: true,
			};

			expect(received1).toMatchObject(expected1);
		});
	});
});
