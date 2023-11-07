import { ok, err, Result } from '@synonymdev/result';

import actions from './actions';
import { getDispatch, getFeesStore } from '../helpers';
import { getFeeEstimates } from '../../utils/wallet/transactions';
import { TAvailableNetworks } from '../../utils/networks';
import { IOnchainFees } from '../types/fees';

const dispatch = getDispatch();

export const REFRESH_INTERVAL = 60 * 30; // in seconds, 30 minutes

export const updateOnchainFeeEstimates = async ({
	selectedNetwork,
	forceUpdate = false,
}: {
	selectedNetwork: TAvailableNetworks;
	forceUpdate?: boolean;
}): Promise<Result<string>> => {
	const feesStore = getFeesStore();
	const timestamp = feesStore.onchain.timestamp;
	const difference = Math.floor((Date.now() - timestamp) / 1000);

	if (feesStore.override) {
		return ok('On-chain fee estimates are overridden.');
	}

	if (!forceUpdate && difference < REFRESH_INTERVAL) {
		return ok('On-chain fee estimates are up to date.');
	}

	const feeEstimates = await getFeeEstimates(selectedNetwork);
	if (feeEstimates.isErr()) {
		return err(feeEstimates.error);
	}

	dispatch({
		type: actions.UPDATE_ONCHAIN_FEE_ESTIMATES,
		payload: feeEstimates.value,
	});

	return ok('Successfully updated on-chain fee estimates.');
};

export const overrideOnchainFeeEstimates = (
	feeEstimates: IOnchainFees,
): Result<string> => {
	dispatch({
		type: actions.UPDATE_ONCHAIN_FEE_ESTIMATES,
		payload: feeEstimates,
	});
	return ok('Successfully overrode on-chain fee estimates.');
};

export const updateOverrideFee = (enable: boolean): Result<string> => {
	dispatch({ type: actions.UPDATE_OVERRIDE_FEES, payload: enable });
	return ok('');
};

/*
 * This resets the fees store to the default shape
 */
export const resetFeesStore = (): Result<string> => {
	dispatch({ type: actions.RESET_FEES_STORE });
	return ok('');
};
