// Add migrations for every persisted store version change
import { PersistedState } from 'redux-persist';
import { getDefaultGapLimitOptions } from '../shapes/wallet';

const migrations = {
	43: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				scanAllAddressesTimestamp: 0,
			},
			wallet: {
				...state.wallet,
				gapLimitOptions: getDefaultGapLimitOptions(),
			},
		};
	},
};

export default migrations;
