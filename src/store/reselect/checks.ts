import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { IChecksShape, TStorageWarning } from '../types/checks';
import { selectedNetworkSelector, selectedWalletSelector } from './wallet';

export const checksState = (state: RootState): IChecksShape => state.checks;

/**
 * Returns the warnings for a given wallet.
 */
export const warningsSelector = createSelector(
	[checksState, selectedWalletSelector, selectedNetworkSelector],
	(checks, selectedWallet, selectedNetwork): TStorageWarning[] => {
		return checks[selectedWallet].warnings[selectedNetwork];
	},
);
