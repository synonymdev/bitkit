import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';

import '../src/utils/i18n';
import store, { RootState } from '../src/store';
import { createNewWallet } from '../src/utils/startup';
import { updateWallet } from '../src/store/actions/wallet';
import { EAvailableNetwork } from '../src/utils/networks';
import {
	balanceSelector,
	lnSetupSelector,
} from '../src/store/reselect/aggregations';
import { TChannel, EChannelStatus } from '../src/store/types/lightning';
import { channelsSizeSelector, pendingChannelsSelector } from '../src/store/reselect/lightning';

describe('Reselect', () => {
	let s: RootState;

	beforeAll(async () => {
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		updateWallet({ selectedNetwork: EAvailableNetwork.bitcoinRegtest, selectedWallet: 'wallet0' });
		s = store.getState();
	});

	describe('lnChannelsSelector', () => {
		it('should return empty array by default', () => {
			const state = cloneDeep(s);

			// expect(pendingChannelsSelector(state)).toEqual([]);
			expect(channelsSizeSelector(state)).toEqual(0);
		})
	})
});
