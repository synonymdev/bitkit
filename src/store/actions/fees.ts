import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import { getDispatch, getFeesStore } from '../helpers';
import { getSelectedNetwork } from '../../utils/wallet';
import { getFeeEstimates } from '../../utils/wallet/transactions';
import { TAvailableNetworks } from '../../utils/networks';

const dispatch = getDispatch();

export const REFRESH_INTERVAL = 60 * 30; // in seconds, 30 minutes

// currently unused
// export const updateFees = async (payload): Promise<void> => {
// 	dispatch({
// 		type: actions.UPDATE_FEES,
// 		payload,
// 	});
// };

export const updateOnchainFeeEstimates = async ({
	selectedNetwork,
	forceUpdate = false,
}: {
	selectedNetwork: TAvailableNetworks;
	forceUpdate?: boolean;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const feesStore = getFeesStore();
	const timestamp = feesStore.onchain.timestamp;
	const difference = Math.floor((Date.now() - timestamp) / 1000);

	if (forceUpdate || (timestamp && difference > REFRESH_INTERVAL)) {
		const feeEstimates = await getFeeEstimates(selectedNetwork);
		dispatch({
			type: actions.UPDATE_ONCHAIN_FEE_ESTIMATES,
			payload: feeEstimates,
		});
	}

	return ok('Successfully updated on-chain fee estimates.');
};

/*
 * This resets the fees store to the default shape
 */
export const resetFeesStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_FEES_STORE,
	});
	return ok('');
};
