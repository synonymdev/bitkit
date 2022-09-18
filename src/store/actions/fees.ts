import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { getSelectedNetwork } from '../../utils/wallet';
import { getFeeEstimates } from '../../utils/wallet/transactions';
import { TAvailableNetworks } from '../../utils/networks';
import { IOnchainFees } from '../types/fees';
import { defaultFeesShape } from '../shapes/fees';

const dispatch = getDispatch();

export const updateFees = async (payload): Promise<void> => {
	dispatch({
		type: actions.UPDATE_FEES,
		payload,
	});
};

export const updateOnchainFeeEstimates = async ({
	selectedNetwork,
	forceUpdate = false,
}: {
	selectedNetwork: TAvailableNetworks;
	forceUpdate?: boolean;
}): Promise<IOnchainFees> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	let fees = getStore().fees.onchain ?? defaultFeesShape.onchain;
	const timestamp = getStore().fees.onchain?.timestamp;
	const difference = Math.floor((Date.now() - timestamp) / 1000);
	if (!forceUpdate && timestamp && difference > 5000) {
		fees = await getFeeEstimates(selectedNetwork);
		dispatch({
			type: actions.UPDATE_ONCHAIN_FEE_ESTIMATES,
			payload: fees,
		});
	}
	return fees;
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
