import { Result, err, ok } from '@synonymdev/result';
import { IOnchainFees } from 'beignet';

import { getOnChainWalletAsync } from '../../utils/wallet';
import { dispatch, getFeesStore } from '../helpers';
import { updateOnchainFees } from '../slices/fees';

export const updateOnchainFeeEstimates = async ({
	forceUpdate = false,
	feeEstimates,
}: {
	forceUpdate?: boolean;
	feeEstimates?: IOnchainFees;
}): Promise<Result<string>> => {
	const feesStore = getFeesStore();
	if (feesStore.override) {
		return ok('On-chain fee estimates are overridden.');
	}

	if (!feeEstimates) {
		const feeEstimatesRes = await refreshOnchainFeeEstimates({ forceUpdate });
		if (feeEstimatesRes.isErr()) {
			return err(feeEstimatesRes.error);
		}
		feeEstimates = feeEstimatesRes.value;
	}

	dispatch(updateOnchainFees(feeEstimates));

	return ok('Successfully updated on-chain fee estimates.');
};

export const refreshOnchainFeeEstimates = async ({
	forceUpdate = false,
}: {
	forceUpdate?: boolean;
}): Promise<Result<IOnchainFees>> => {
	const wallet = await getOnChainWalletAsync();
	return await wallet.updateFeeEstimates(forceUpdate);
};
