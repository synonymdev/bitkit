import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IFees, IOnchainFees } from '../types/fees';

const feesState = (state: Store): IFees => state.fees;

export const onChainFeesSelector = createSelector(
	[feesState],
	(fees): IOnchainFees => fees.onchain,
);
