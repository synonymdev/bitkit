import { createSelector } from '@reduxjs/toolkit';

import { blocktankInfoSelector } from './blocktank';
import { lightningBalanceSelector } from './lightning';
import { onChainBalanceSelector } from './wallet';
import { DIFF, SPENDING_LIMIT_RATIO } from '../../utils/wallet/constants';

/**
 * Returns all balances
 */
export const balanceSelector = createSelector(
	[lightningBalanceSelector, onChainBalanceSelector],
	(lightning, onchain) => {
		const totalSpendableBalance = onchain + lightning.spendingBalance;
		const totalBalance = onchain + lightning.lightningBalance;

		return {
			onchainBalance: onchain,
			lightningBalance: lightning.lightningBalance,
			lightningSpendingBalance: lightning.spendingBalance,
			lightningReserveBalance: lightning.reserveBalance,
			lightningClaimableBalance: lightning.claimableBalance,
			totalBalance,
			totalSpendableBalance,
		};
	},
);

export type TLnSetup = {
	slider: {
		startValue: number;
		endValue: number;
		maxValue: number;
	};
	percentage: {
		spendings: number;
		savings: number;
	};
	spendableBalance: number;
	btSpendingLimitBalanced: number;
	defaultClientBalance: number;
};

export const lnSetupSelector = createSelector(
	[
		blocktankInfoSelector,
		onChainBalanceSelector,
		(_, spendingAmount): number => spendingAmount,
	],
	(blocktankInfo, onchainBalance, spendingAmount: number): TLnSetup => {
		if (onchainBalance === 0) {
			throw new TypeError('Cannot setup LN with 0 onchain balance');
		}

		const btMaxClientBalanceSat = blocktankInfo.options.maxClientBalanceSat;
		const btMaxChannelSizeSat = blocktankInfo.options.maxChannelSizeSat;

		const btSpendingLimitBalanced = Math.min(
			Math.round(btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * DIFF),
			btMaxClientBalanceSat,
		);
		const spendableBalance = Math.round(onchainBalance * SPENDING_LIMIT_RATIO);
		const spendingLimit = Math.min(spendableBalance, btSpendingLimitBalanced);

		const savingsAmount = onchainBalance - spendingAmount;
		const savingsPercentage = Math.round(
			(savingsAmount / onchainBalance) * 100,
		);
		const spendingsPercentage = Math.round(
			(spendingAmount / onchainBalance) * 100,
		);

		const defaultClientBalance = Math.min(
			Math.round(onchainBalance * 0.2),
			btSpendingLimitBalanced,
		);

		return {
			slider: {
				startValue: 0,
				maxValue: spendingLimit,
				endValue: onchainBalance,
			},
			percentage: {
				spendings: spendingsPercentage,
				savings: savingsPercentage,
			},
			spendableBalance,
			btSpendingLimitBalanced,
			defaultClientBalance,
		};
	},
);

export const lnTransferSelector = createSelector(
	[
		blocktankInfoSelector,
		balanceSelector,
		(_, spendingAmount): number => spendingAmount,
	],
	(blocktankInfo, balance, spendingAmount: number): TLnSetup => {
		if (balance.onchainBalance === 0) {
			throw new TypeError('Cannot setup LN with 0 onchain balance');
		}

		const totalBalance = balance.totalBalance;

		const btSpendingLimit = blocktankInfo.options.maxChannelSizeSat;
		const btSpendingLimitBalanced = Math.round(
			btSpendingLimit / 2 - btSpendingLimit * DIFF,
		);

		const spendableBalance = Math.round(totalBalance * SPENDING_LIMIT_RATIO);
		const savingsAmount = totalBalance - spendingAmount;
		const spendingsPercentage = Math.round((spendingAmount / totalBalance) * 100);
		const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);
		const isTransferringToSavings = spendingAmount < balance.lightningBalance;
		const isButtonDisabled = spendingAmount === balance.lightningBalance;
		const spendingLimit = Math.min(balance.totalSpendableBalance, btSpendingLimitBalanced, balance.lightningBalance);

		return {
			slider: {
				startValue: 0,
				maxValue: spendingLimit,
				endValue: totalBalance,
				snapPoint: balance.lightningBalance,
			},
			percentage: {
				spendings: spendingsPercentage,
				savings: savingsPercentage,
			},
			spendableBalance,
			btSpendingLimitBalanced,
			isTransferringToSavings,
			isButtonDisabled,
			defaultClientBalance: balance.lightningBalance,
		};
	},
);

