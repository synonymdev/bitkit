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
	46: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				transferIntroSeen: false,
				spendingIntroSeen: false,
				savingsIntroSeen: false,
			},
		};
	},
	47: (state): PersistedState => {
		return {
			...state,
			metadata: {
				...state.metadata,
				comments: {},
			},
		};
	},
	48: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				enableQuickpay: false,
				quickpayAmount: 5,
			},
			user: {
				...state.user,
				quickpayIntroSeen: false,
			},
		};
	},
};

export default migrations;
