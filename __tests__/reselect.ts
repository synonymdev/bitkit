import cloneDeep from 'lodash/cloneDeep';
import assert from 'node:assert';

import '../src/utils/i18n';
import store, { RootState } from '../src/store';
import { dispatch } from '../src/store/helpers';
import { updateWallet } from '../src/store/slices/wallet';
import {
	TBalance,
	balanceSelector,
	lnSetupSelector,
} from '../src/store/reselect/aggregations';
import { EChannelStatus, TChannel } from '../src/store/types/lightning';
import { EAvailableNetwork } from '../src/utils/networks';
import { createNewWallet } from '../src/utils/startup';

describe('Reselect', () => {
	let s: RootState;

	beforeAll(async () => {
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		dispatch(
			updateWallet({ selectedNetwork: EAvailableNetwork.bitcoinRegtest }),
		);
		s = store.getState();
	});

	describe('balanceSelector', () => {
		it('should return zeros by default', () => {
			const state = cloneDeep(s);

			const balance: TBalance = {
				balanceInTransferToSavings: 0,
				balanceInTransferToSpending: 0,
				claimableBalance: 0,
				lightningBalance: 0,
				onchainBalance: 0,
				pendingPaymentsBalance: 0,
				reserveBalance: 0,
				spendableBalance: 0,
				spendingBalance: 0,
				totalBalance: 0,
			};

			assert.deepEqual(balanceSelector(state), balance);
		});

		it('should return onchain balance for current wallet', () => {
			const state = cloneDeep(s);
			state.wallet.wallets.wallet0.balance.bitcoinRegtest = 1;

			const balance: TBalance = {
				balanceInTransferToSavings: 0,
				balanceInTransferToSpending: 0,
				claimableBalance: 0,
				lightningBalance: 0,
				onchainBalance: 1,
				pendingPaymentsBalance: 0,
				reserveBalance: 0,
				spendableBalance: 1,
				spendingBalance: 0,
				totalBalance: 1,
			};

			assert.deepEqual(balanceSelector(state), balance);
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

			const balance: TBalance = {
				balanceInTransferToSavings: 3,
				balanceInTransferToSpending: 0,
				claimableBalance: 3,
				lightningBalance: 4,
				onchainBalance: 1,
				pendingPaymentsBalance: 0,
				reserveBalance: 2,
				spendableBalance: 3,
				spendingBalance: 2,
				totalBalance: 8,
			};

			assert.deepEqual(balanceSelector(state), balance);
		});
	});

	describe('lnSetupSelector', () => {
		it('should calculate percentage correctly', () => {
			const state = cloneDeep(s);
			// balance under maxChannelSizeSat
			state.wallet.wallets.wallet0.balance.bitcoinRegtest = 20000;

			expect(lnSetupSelector(state, 0)).toMatchObject({
				percentage: {
					savings: 100,
					spending: 0,
				},
				canContinue: false,
			});

			expect(lnSetupSelector(state, 10000)).toMatchObject({
				percentage: {
					savings: 50,
					spending: 50,
				},
				canContinue: true,
			});

			expect(lnSetupSelector(state, 16000)).toMatchObject({
				percentage: {
					savings: 20,
					spending: 80,
				},
				canContinue: true,
			});
		});

		it('should calculate client balance limits without LN channels', () => {
			// max value is limited by maxChannelSizeSat / 2
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
					endValue: 1000,
					initialValue: 100,
					maxValue: 100,
				},
				limits: {
					local: 800,
					lsp: 100,
				},
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
					endValue: 50,
					initialValue: 10,
					maxValue: 40,
				},
				limits: {
					local: 40,
					lsp: 100,
				},
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
					endValue: 1002,
					initialValue: 2,
					maxValue: 52,
				},
				limits: {
					local: 802,
					lsp: 52,
				},
				canContinue: true,
			};

			expect(received1).toMatchObject(expected1);
		});

		it('should not produce different slider.maxVlalue for the different spending amount', () => {
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 600000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				max0ConfClientBalanceSat: 0,
				maxChannelSizeSat: 1500000,
				maxClientBalanceSat: 1450000,
				minChannelSizeSat: 100000,
			};
			const channel1 = {
				channel_id: 'channel1',
				status: EChannelStatus.open,
				is_channel_ready: true,
				balance_sat: 370000,
				channel_value_satoshis: 700000,
				outbound_capacity_sat: 400000,
			} as TChannel;
			const lnWallet = s1.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1 };

			const r0 = lnSetupSelector(s1, 0);
			const r1 = lnSetupSelector(s1, 1000);
			const r2 = lnSetupSelector(s1, 8000);
			const r3 = lnSetupSelector(s1, 500000);

			expect(r0.slider.maxValue).toEqual(r1.slider.maxValue);
			expect(r0.slider.maxValue).toEqual(r2.slider.maxValue);
			expect(r0.slider.maxValue).toEqual(r3.slider.maxValue);
		});
	});
});
