import { createSelector } from '@reduxjs/toolkit';

import { blocktankInfoSelector } from './blocktank';
import { channelsSizeSelector, lightningBalanceSelector } from './lightning';
import { onChainBalanceSelector } from './wallet';
import {
	LIGHTNING_DIFF,
	DEFAULT_SPENDING_PERCENTAGE,
	MAX_SPENDING_PERCENTAGE,
	BT_MIN_CHANNEL_SIZE_SAT_MULTIPLIER,
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
	limits: {
		local: number;
		lsp: number;
	};
	initialClientBalance: number;
	clientBalance: number;
	lspBalance: number;
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
		channelsSizeSelector,
		(_, spendingAmount): number => spendingAmount,
	],
	(blocktankInfo, balance, channelsSize, spendingAmount: number): TLnSetup => {
		const { totalBalance, onchainBalance, lightningBalance } = balance;
		const clientBalance = spendingAmount - lightningBalance;
		const maxTotalChannelSize = blocktankInfo.options.maxChannelSizeSat;
		const minChannelSize = Math.round(
			blocktankInfo.options.minChannelSizeSat +
				blocktankInfo.options.minChannelSizeSat *
					BT_MIN_CHANNEL_SIZE_SAT_MULTIPLIER,
		);
		const maxChannelSize = Math.max(0, maxTotalChannelSize - channelsSize);

		// LSP balance must be at least 1.5% of the channel size
		let minLspBalance = Math.round(maxChannelSize * 0.015);
		if (minLspBalance < minChannelSize - clientBalance) {
			// Fill up to minChannelSize
			minLspBalance = minChannelSize - clientBalance;
		}

		const maxClientBalance = maxChannelSize - minLspBalance;
		const maxClientBalanceBalanced = Math.min(
			Math.round(maxChannelSize / 2 - maxChannelSize * LIGHTNING_DIFF),
			maxClientBalance,
		);

		const lspBalance = Math.max(
			// Ensure LSP balance is bigger than client balance
			Math.round(clientBalance + clientBalance * LIGHTNING_DIFF),
			minLspBalance,
		);

		// 80% cap to leave buffer for fees
		const localLimit = Math.round(totalBalance * MAX_SPENDING_PERCENTAGE);
		// the maximum client balance below the node capacity limit
		let lspLimit = lightningBalance + maxClientBalanceBalanced;
		// too close to node capacity limit to open another channel
		if (maxChannelSize < minChannelSize) {
			lspLimit = lightningBalance;
		}

		const spendingLimit = Math.min(localLimit, lspLimit);
		const savingsAmount = totalBalance - spendingAmount;
		const spendingPercentage = Math.round(
			(spendingAmount / totalBalance) * 100,
		);
		const savingsPercentage = Math.round((savingsAmount / totalBalance) * 100);

		const defaultClientBalance = Math.min(
			Math.round(onchainBalance * DEFAULT_SPENDING_PERCENTAGE),
			maxClientBalanceBalanced,
		);

		const initialClientBalance = lightningBalance || defaultClientBalance;
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
				spendings: spendingPercentage,
				savings: savingsPercentage,
			},
			limits: {
				local: localLimit,
				lsp: lspLimit,
			},
			initialClientBalance,
			clientBalance,
			lspBalance,
			isTransferringToSavings,
			canContinue,
		};
	},
);
