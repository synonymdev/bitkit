// Add migrations for every persisted store version change
import { PersistedState } from 'redux-persist';
import { storage as mmkv } from '../../store/mmkv-storage';
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
	49: (state): PersistedState => {
		// only used to remove old Ledger data
		try {
			const keys = mmkv.getAllKeys().filter((k) => k.startsWith('ledger'));
			for (const key of keys) {
				mmkv.delete(key);
			}
		} catch (e) {}

		return state;
	},
	50: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				backupVerified: state.user.backupVerified,
				quickpayIntroSeen: state.user.quickpayIntroSeen,
				transferIntroSeen: state.user.transferIntroSeen,
				spendingIntroSeen: state.user.spendingIntroSeen,
				savingsIntroSeen: state.user.savingsIntroSeen,
			},
		};
	},
	51: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				rapidGossipSyncUrl: 'https://rgs.blocktank.to/snapshot/',
			},
		};
	},
};

export default migrations;
