import cloneDeep from 'lodash/cloneDeep';
import assert from 'node:assert';

import '../src/utils/i18n';
import store, { RootState } from '../src/store';
import { dispatch } from '../src/store/helpers';
import { updateWallet } from '../src/store/slices/wallet';
import {
	TBalance,
	balanceSelector,
	transferLimitsSelector,
} from '../src/store/reselect/aggregations';
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

	describe('transferLimitsSelector', () => {
		it('should calculate limits without LN channels', () => {
			// max value is limited by maxChannelSize / 2
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.options = {
				...s1.blocktank.info.options,
				minChannelSizeSat: 10,
				maxChannelSizeSat: 200,
				maxClientBalanceSat: 100,
			};

			const received1 = transferLimitsSelector(s1);
			const expected1 = {
				minChannelSize: 11,
				maxChannelSize: 190,
				maxClientBalance: 95,
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

			const received2 = transferLimitsSelector(s2);
			const expected2 = {
				minChannelSize: 11,
				maxChannelSize: 190,
				maxClientBalance: 40,
			};

			expect(received2).toMatchObject(expected2);
		});

		it('should calculate limits with existing LN channels', () => {
			const btNodeId =
				'03b9a456fb45d5ac98c02040d39aec77fa3eeb41fd22cf40b862b393bcfc43473a';
			// max value is limited by leftover node capacity
			const s1 = cloneDeep(s);
			s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
			s1.blocktank.info.nodes = [
				{ alias: 'node1', pubkey: btNodeId, connectionStrings: [] },
			];
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
				counterparty_node_id: btNodeId,
			} as TChannel;
			const lnWallet = s1.lightning.nodes.wallet0;
			lnWallet.channels.bitcoinRegtest = { channel1 };

			const received1 = transferLimitsSelector(s1);
			const expected1 = {
				minChannelSize: 11,
				maxChannelSize: 90,
				maxClientBalance: 45,
			};

			expect(received1).toMatchObject(expected1);
		});
	});
});
