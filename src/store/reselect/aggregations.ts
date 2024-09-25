import { ETransferType } from '../types/wallet';
import {
	blocktankChannelsSizeSelector,
	lightningBalanceSelector,
	pendingPaymentsSelector,
} from './lightning';
import { newChannelsNotificationsSelector } from './todos';
import { onChainBalanceSelector, pendingTransfersSelector } from './wallet';
import { createShallowEqualSelector } from './utils';
import { activityItemsSelector } from './activity';
import { EActivityType } from '../types/activity';
import { blocktankInfoSelector } from './blocktank';

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

/**
 * Returns limits for channel orders with the LSP
 */
export const transferLimitsSelector = createShallowEqualSelector(
	[
		blocktankInfoSelector,
		onChainBalanceSelector,
		blocktankChannelsSizeSelector,
	],
	(
		blocktankInfo,
		onchainBalance,
		channelsSize,
	): {
		minChannelSize: number;
		maxChannelSize: number;
		maxClientBalance: number;
	} => {
		const { minChannelSizeSat, maxChannelSizeSat } = blocktankInfo.options;
		// Because LSP limits constantly change depending on network fees
		// add a 5% buffer to avoid fluctuations while making the order
		const minChannelSize = Math.round(minChannelSizeSat * 1.05);
		const maxChannelSize1 = Math.round(maxChannelSizeSat * 0.95);
		// The maximum channel size the user can open including existing channels
		const maxChannelSize2 = Math.max(0, maxChannelSize1 - channelsSize);
		const maxChannelSize = Math.min(maxChannelSize1, maxChannelSize2);

		// 80% cap to leave buffer for fees
		const localLimit = Math.round(onchainBalance * 0.8);
		// LSP balance must be at least 1.5% of the client balance
		// const minLspBalance1 = Math.round(clientBalance * 0.02);
		// const minLspBalance2 = Math.round(minChannelSize - clientBalance);
		// const minLspBalance = Math.max(minLspBalance1, minLspBalance2);
		// LSP balance must be at least half of the channel size
		// The actual requirement is much lower, but we want to give the user a balanced channel.
		// TODO: get exact requirements from LSP
		const lspLimit = Math.round(maxChannelSize / 2);
		const maxClientBalance = Math.min(localLimit, lspLimit);

		return {
			minChannelSize,
			maxChannelSize,
			maxClientBalance,
		};
	},
);

// Determine if the onboarding text is shown on the ActivitySpending screen
export const spendingOnboardingSelector = createShallowEqualSelector(
	[lightningBalanceSelector, pendingTransfersSelector, activityItemsSelector],
	(lightningBalance, pendingTransfers, activityItems): boolean => {
		const { spendingBalance } = lightningBalance;

		let inTransferToSpending = pendingTransfers.reduce((acc, transfer) => {
			if (transfer.type === ETransferType.open) {
				acc += transfer.amount;
			}
			return acc;
		}, 0);

		const spendingItems = activityItems.filter((item) => {
			return item.activityType === EActivityType.lightning;
		});

		const isOnboarding =
			spendingBalance === 0 &&
			spendingItems.length === 0 &&
			!inTransferToSpending;

		return isOnboarding;
	},
);
