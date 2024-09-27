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
	44: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				rbf: true,
			},
		};
	},
	45: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				orangeTickets: [],
			},
		};
	},
};

export default migrations;
