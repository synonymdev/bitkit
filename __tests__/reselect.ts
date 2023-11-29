import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';
import { TChannel } from '@synonymdev/react-native-ldk';

import '../src/utils/i18n';
import store from '../src/store';
import Store from '../src/store/types';
import { createNewWallet } from '../src/utils/startup';
import { updateWallet } from '../src/store/actions/wallet';
import {
	balanceSelector,
	lnSetupSelector,
} from '../src/store/reselect/aggregations';

describe('Reselect', () => {
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
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;
			const channel2 = {
				channel_id: 'channel2',
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;
			const channel3 = {
				channel_id: 'channel3',
				is_channel_ready: false,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;

			const lnWallet = state.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1, channel2, channel3 };
			lnWallet.openChannelIds.bitcoinRegtest = [
				'channel1',
				'channel2',
				'channel3',
			];
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

	describe('lnSetupSelector', () => {
		it('should throw if onchain balance is 0', () => {
			const state = cloneDeep(s);
			expect(() => lnSetupSelector(state, 0)).toThrow(TypeError);
		});

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

		it('should calculate btSpendingLimitBalanced without LN channels', () => {
			// max value is limited by btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * DIFF
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};

			expect(lnSetupSelector(s1, 0)).toMatchObject({
				slider: {
					startValue: 0,
					maxValue: 98,
					endValue: 1000,
				},
				btSpendingLimitBalanced: 98,
				spendableBalance: 800,
				defaultClientBalance: 98,
			});

			// max value is limited by btMaxClientBalanceSat
			const s2 = cloneDeep(s);
			s2.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s2.blocktank.info.options = {
				...s2.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 50,
			};

			expect(lnSetupSelector(s2, 0)).toMatchObject({
				slider: {
					startValue: 0,
					maxValue: 50,
					endValue: 1000,
				},
				btSpendingLimitBalanced: 50,
				spendableBalance: 800,
				defaultClientBalance: 50,
			});

			// max value is limited by onchain balance
			const s3 = cloneDeep(s);
			s3.wallet.wallets.wallet0.balance.bitcoinRegtest = 50;
			s3.blocktank.info.options = {
				...s3.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};

			expect(lnSetupSelector(s3, 0)).toMatchObject({
				slider: {
					startValue: 0,
					maxValue: 40,
					endValue: 50,
				},
				btSpendingLimitBalanced: 98,
				spendableBalance: 40,
				defaultClientBalance: 10,
			});
		});

		it('should calculate btSpendingLimitBalanced with LN channels', () => {
			// max value is limited by btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * DIFF
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};
			const channel1 = {
				channel_id: 'channel1',
				is_channel_ready: true,
				outbound_capacity_sat: 1,
				balance_sat: 2,
			} as TChannel;
			const lnWallet = s1.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1 };
			lnWallet.openChannelIds.bitcoinRegtest = ['channel1'];
			lnWallet.claimableBalance.bitcoinRegtest = 3;

			expect(lnSetupSelector(s1, 20)).toMatchObject({
				slider: {
					startValue: 0,
					maxValue: 98,
					endValue: 1005,
				},
				btSpendingLimitBalanced: 98,
				spendableBalance: 804,
				defaultClientBalance: 5,
				canContinue: true,
			});
		});
	});
});
