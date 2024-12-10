import { ETransferType } from '../types/wallet';
import { lightningBalanceSelector, pendingPaymentsSelector } from './lightning';
import { newChannelsNotificationsSelector } from './todos';
import { onChainBalanceSelector, pendingTransfersSelector } from './wallet';
import { createShallowEqualSelector } from './utils';
import { activityItemsSelector } from './activity';
import { EActivityType } from '../types/activity';

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
