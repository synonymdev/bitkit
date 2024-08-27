import cloneDeep from 'lodash/cloneDeep';
import assert from 'node:assert';

import '../src/utils/i18n';
import store, { RootState } from '../src/store';
import { dispatch } from '../src/store/helpers';
import { updateWallet } from '../src/store/slices/wallet';
import { TBalance, balanceSelector } from '../src/store/reselect/aggregations';
import {
	EChannelClosureReason,
	EChannelStatus,
	TChannel,
} from '../src/store/types/lightning';
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
				closureReason: EChannelClosureReason.HolderForceClosed,
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
});
