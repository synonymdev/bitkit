import { createSelector } from '@reduxjs/toolkit';

import { lightningBalanceSelector } from './lightning';
import { onChainBalanceSelector } from './wallet';

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
