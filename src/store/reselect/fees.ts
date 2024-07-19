import { IOnchainFees } from 'beignet';
import { RootState } from '..';

export const onChainFeesSelector = (state: RootState): IOnchainFees => {
	return state.fees.onchain;
};

export const overrideFeeSelector = (state: RootState): boolean => {
	return state.fees.override;
};
