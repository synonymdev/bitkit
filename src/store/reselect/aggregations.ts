import {
	DEFAULT_SPENDING_PERCENTAGE,
	MAX_SPENDING_PERCENTAGE,
} from '../../utils/wallet/constants';
import { ETransferType } from '../types/wallet';
import { blocktankInfoSelector } from './blocktank';
import {
	channelsSizeSelector,
	lightningBalanceSelector,
	pendingPaymentsSelector,
} from './lightning';
import { newChannelsNotificationsSelector } from './todos';
import { onChainBalanceSelector, pendingTransfersSelector } from './wallet';
import { createShallowEqualSelector } from './utils';

export type TBalance = {
	/** Total onchain funds */
	onchainBalance: number;
	/** Total lightning funds (spendable + reserved + claimable) */
	lightningBalance: number;
	/** Share of lightning funds that are spendable */
	spendingBalance: number;
	/** Share of lightning funds that are locked up in channels */
	reserveBalance: number;
	/** Funds that will be available after a channel opens/closes */
	claimableBalance: number;
	/** Total spendable funds (onchain + spendable lightning) */
	spendableBalance: number;
	/** LN funds that have not been claimed by payee (hold invoices) */
	pendingPaymentsBalance: number;
	balanceInTransferToSpending: number;
	balanceInTransferToSavings: number;
	/** Total funds (all of the above) */
	totalBalance: number;
};

export const balanceSelector = createShallowEqualSelector(
	[
		onChainBalanceSelector,
		pendingTransfersSelector,
		pendingPaymentsSelector,
		newChannelsNotificationsSelector,
		lightningBalanceSelector,
	],
	(
		onchainBalance,
		pendingTransfers,
		pendingPayments,
		newChannels,
		lnBalance,
	): TBalance => {
		const {
			lightningBalance,
			spendingBalance,
			reserveBalance,
			claimableBalance,
		} = lnBalance;
		const spendableBalance = onchainBalance + spendingBalance;
		const pendingPaymentsBalance = pendingPayments.reduce(
			(acc, payment) => acc + payment.amount,
			0,
		);

		let inTransferToSpending = pendingTransfers.reduce((acc, transfer) => {
			if (transfer.type === ETransferType.open) {
				acc += transfer.amount;
			}
			return acc;
		}, 0);

		if (newChannels.length > 0) {
			// avoid flashing wrong balance on channel open
			inTransferToSpending = 0;
		}

		const totalBalance =
			onchainBalance +
			lightningBalance +
			claimableBalance +
			inTransferToSpending;

		return {
			onchainBalance,
			lightningBalance,
			spendingBalance,
			reserveBalance,
			claimableBalance,
			spendableBalance,
			pendingPaymentsBalance,
			balanceInTransferToSpending: inTransferToSpending,
			balanceInTransferToSavings: claimableBalance,
			totalBalance,
		};
	},
);

export type TLnSetup = {
	slider: {
		startValue: number;
		endValue: number;
		initialValue: number;
		maxValue: number;
		snapPoint?: number;
	};
	percentage: {
		spending: number;
		savings: number;
	};
	limits: {
		minChannelSize: number;
		local: number;
		lsp: number;
	};
	clientBalance: number;
	lspBalance: number;
	isTransferringToSavings: boolean;
	canOnlyClose: boolean;
	canContinue: boolean;
};

/**
 * Returns the setup for the LN slider.
 */
export const lnSetupSelector = createShallowEqualSelector(
	[
		blocktankInfoSelector,
		balanceSelector,
		channelsSizeSelector,
		(_state, spending): number => spending,
	],
	(blocktankInfo, balance, channelsSize, spending: number): TLnSetup => {
		const { onchainBalance, lightningBalance } = balance;
		const totalBalance = onchainBalance + lightningBalance;
		const clientBalance = spending - lightningBalance;
		const { minChannelSizeSat, maxChannelSizeSat } = blocktankInfo.options;
		// Because BT /info minChannelSizeSat constantly changes depending on network fees,
		// add a 10% buffer to avoid falling below the minimum while making the order.
		const minChannelSize = Math.round(minChannelSizeSat * 1.1);
		// The maximum channel size the user can open including existing channels
		const maxChannelSize = Math.max(0, maxChannelSizeSat - channelsSize);
		// LSP balance must be at least half the channel size
		// The actual requirement is much lower, but we want to give the user a balanced channel.
		const minLspBalance = Math.round(maxChannelSize / 2);
		const maxClientBalance = maxChannelSize - minLspBalance;

		// Give the user a balanced channel
		let lspBalance = clientBalance;
		// If resulting channel size is not large enough, add more to the LSP side.
		if (clientBalance + lspBalance < minChannelSize) {
			lspBalance = minChannelSize - clientBalance;
		}

		// 80% cap to leave buffer for fees
		const localLimit = Math.round(totalBalance * MAX_SPENDING_PERCENTAGE);
		// The maximum client balance below the node capacity limit
		let lspLimit = lightningBalance + maxClientBalance;
		// Too close to node capacity limit to open another channel
		if (maxChannelSize < minChannelSize) {
			lspLimit = lightningBalance;
		}

		const limit = Math.min(localLimit, lspLimit);
		const savings = totalBalance - spending;
		const spendingPercentage = Math.round((spending / totalBalance) * 100);
		const savingsPercentage = Math.round((savings / totalBalance) * 100);
		const isTransferringToSavings = spending < lightningBalance;
		const canOnlyClose = limit === lightningBalance;
		const canContinue = spending !== lightningBalance && spending <= limit;

		// Default value for the slider (20% of onchain). Cap it at the spending limit.
		const defaultClientBalance = Math.min(
			Math.round(onchainBalance * DEFAULT_SPENDING_PERCENTAGE),
			limit,
		);

		const slider = {
			startValue: 0,
			endValue: totalBalance,
			// Initial value for the slider. If the user has a balance, use that.
			initialValue: lightningBalance || defaultClientBalance,
			// Maximum choosable value for the slider. If the user is over the limit, adjust so UI doesn't break.
			maxValue: Math.max(limit, lightningBalance),
			snapPoint: lightningBalance || undefined,
		};

		return {
			slider,
			percentage: {
				spending: spendingPercentage,
				savings: savingsPercentage,
			},
			limits: {
				minChannelSize,
				local: localLimit,
				lsp: lspLimit,
			},
			clientBalance,
			lspBalance,
			isTransferringToSavings,
			canOnlyClose,
			canContinue,
		};
	},
);
