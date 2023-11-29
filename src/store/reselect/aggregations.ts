import { createSelector } from '@reduxjs/toolkit';

import { blocktankInfoSelector } from './blocktank';
import { lightningBalanceSelector } from './lightning';
import { onChainBalanceSelector } from './wallet';
import {
	LIGHTNING_DIFF,
	LIGHTNING_DEFAULT_SLIDER,
	SPENDING_LIMIT_RATIO,
} from '../../utils/wallet/constants';

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
		snapPoint: number;
	};
	percentage: {
		spendings: number;
		savings: number;
	};
	spendableBalance: number;
	btSpendingLimitBalanced: number;
	defaultClientBalance: number;
	canContinue: boolean;
	isTransferringToSavings: boolean;
};

/**
 * Returns the setup for the LN slider.
 */
export const lnSetupSelector = createSelector(
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
		const lightningBalance = balance.lightningBalance;

		const btMaxClientBalanceSat = blocktankInfo.options.maxClientBalanceSat;
		const btMaxChannelSizeSat = blocktankInfo.options.maxChannelSizeSat;
		const btSpendingLimitBalanced = Math.min(
			Math.round(
				btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * LIGHTNING_DIFF,
			),
			btMaxClientBalanceSat,
		);

		const spendableBalance = Math.round(totalBalance * SPENDING_LIMIT_RATIO);
		const savingsAmount = totalBalance - spendingAmount;
		const spendingsPercentage = Math.round(
			(spendingAmount / totalBalance) * 100,
		);
		const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);
		const spendingLimit = Math.max(
			Math.min(spendableBalance, btSpendingLimitBalanced),
			lightningBalance,
		);

		let defaultClientBalance = lightningBalance;
		if (!defaultClientBalance) {
			defaultClientBalance = Math.min(
				Math.round(balance.onchainBalance * LIGHTNING_DEFAULT_SLIDER),
				btSpendingLimitBalanced,
			);
		}

		const isTransferringToSavings = spendingAmount < lightningBalance;
		const canContinue =
			spendingAmount !== lightningBalance && spendingAmount <= spendingLimit;

		return {
			slider: {
				startValue: 0,
				maxValue: spendingLimit,
				endValue: totalBalance,
				snapPoint: lightningBalance,
			},
			percentage: {
				spendings: spendingsPercentage,
				savings: savingsPercentage,
			},
			spendableBalance,
			btSpendingLimitBalanced,
			defaultClientBalance,
			isTransferringToSavings,
			canContinue,
		};
	},
);
