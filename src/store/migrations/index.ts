// Add migrations for every persisted store version change
import { PersistedState } from 'redux-persist';
import { storage as mmkv } from '../../storage';
import { getDefaultOptions } from '../../utils/widgets';
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
		} catch (_e) {}

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
	52: (state): PersistedState => {
		// add 'url' to all widgets
		const newWidgets = { ...state.widgets.widgets };

		for (const url of Object.keys(newWidgets)) {
			newWidgets[url].url = url;
		}

		return {
			...state,
			widgets: {
				...state.widgets,
				widgets: newWidgets,
			},
		};
	},
	53: (state): PersistedState => {
		const newWidgets = { ...state.widgets.widgets };

		// migrate slashfeed widgets
		for (const key of Object.keys(newWidgets)) {
			if (key.includes('Bitcoin Price')) {
				delete newWidgets[key];
				newWidgets.price = getDefaultOptions('price');
			} else if (key.includes('Bitcoin Headlines')) {
				delete newWidgets[key];
				newWidgets.news = getDefaultOptions('news');
			} else if (key.includes('Bitcoin Blocks')) {
				delete newWidgets[key];
				newWidgets.blocks = getDefaultOptions('blocks');
			} else if (key.includes('Bitcoin Facts')) {
				delete newWidgets[key];
				newWidgets.facts = getDefaultOptions('facts');
			} else if (key === 'calculator') {
				delete newWidgets[key];
				newWidgets.calculator = getDefaultOptions('calculator');
			} else if (key === 'weather') {
				delete newWidgets[key];
				newWidgets.weather = getDefaultOptions('weather');
			}
		}

		return {
			...state,
			widgets: {
				...state.widgets,
				widgets: newWidgets,
			},
		};
	},
	54: (state): PersistedState => {
		// migrate widgets sort order
		const newSortOrder = state.widgets.sortOrder
			.map((item) => {
				// Handle slashfeed items
				if (item.includes('slashfeed:')) {
					if (item.includes('Bitcoin Headlines')) return 'news';
					if (item.includes('Bitcoin Price')) return 'price';
					if (item.includes('Bitcoin Blocks')) return 'blocks';
					if (item.includes('Bitcoin Facts')) return 'facts';
				}
				// Non-slashfeed items pass through unchanged
				return item;
			})
			.filter((item, index, arr) => {
				// Remove duplicates
				return arr.indexOf(item) === index;
			});

		return {
			...state,
			widgets: {
				...state.widgets,
				sortOrder: newSortOrder,
			},
		};
	},
	55: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				shopIntroSeen: state.user.shopIntroSeen,
			},
		};
	},
};

export default migrations;
