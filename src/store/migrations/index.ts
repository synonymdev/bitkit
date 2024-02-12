// Add migrations for every persisted store version change

import { EAddressType } from 'beignet';
import { defaultAddressContent } from 'beignet/src/shapes/wallet';
import { PersistedState } from 'redux-persist';

import { __WEB_RELAY__ } from '../../constants/env';
import { getDefaultSettings } from '../../screens/Widgets/WidgetEdit';
import { EAvailableNetwork } from '../../utils/networks';
import { initialBackupState } from '../shapes/backup';
import { defaultBlocktankInfoShape } from '../shapes/blocktank';
import { initialTodosState } from '../shapes/todos';
import { defaultViewControllers } from '../shapes/ui';
import {
	getDefaultWalletStoreShape,
	getNetworkContent,
} from '../shapes/wallet';
import { initialActivityState } from '../slices/activity';
import { initialChecksState } from '../slices/checks';
import { initialWidgetsState } from '../slices/widgets';
import { EBackupCategories } from '../utils/backup';
import { EDenomination, EUnit } from '../types/wallet';

const migrations = {
	0: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
		};
	},
	1: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
		};
	},
	2: (state): PersistedState => {
		const sortOrder = Object.keys(state.widgets.widgets);

		return {
			...state,
			widgets: {
				...state.widgets,
				sortOrder,
			},
		};
	},
	3: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
			user: {
				...state.user,
				startCoopCloseTimestamp: 0,
				viewController: defaultViewControllers,
			},
		};
	},
	4: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				ignoreAppUpdateTimestamp: 0,
			},
		};
	},
	5: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
		};
	},
	6: (state): PersistedState => {
		return {
			...state,
			activity: initialActivityState,
		};
	},
	7: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				customFeeRate: 0,
			},
		};
	},
	8: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
		};
	},
	9: (state): PersistedState => {
		return {
			...state,
			checks: initialChecksState,
		};
	},
	10: (state): PersistedState => {
		// remove lnurlpay from receivePreference
		const receivePreference = state.settings.receivePreference.filter(
			(i) => i.key !== 'lnurlpay',
		);

		return {
			...state,
			settings: {
				...state.settings,
				receivePreference,
			},
		};
	},
	11: (state): PersistedState => {
		return {
			...state,
			backup: {
				...initialBackupState,
				...state.backup,
			},
		};
	},
	12: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
			user: {
				...state.user,
				lightningSettingUpStep: 0,
			},
		};
	},
	13: (state): PersistedState => {
		const newState = { ...state };
		// Loop through all wallets
		for (const walletName in newState.wallet.wallets) {
			// Add unconfirmedTransactions to each wallet, with the initial value set.
			newState.wallet.wallets[walletName] = {
				...newState.wallet.wallets[walletName],
				unconfirmedTransactions: getNetworkContent({}),
			};
		}
		return newState;
	},
	14: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				pinOnIdle: false,
			},
		};
	},
	15: (state): PersistedState => {
		// remove old unit settings
		delete state.settings.bitcoinUnit;
		delete state.settings.balanceUnit;

		// LN activity value should be positive
		const items = state.activity.items.map((item: { value: number }) => ({
			...item,
			value: Math.abs(item.value),
		}));

		return {
			...state,
			settings: {
				...state.settings,
				unit: 'satoshi',
			},
			activity: {
				...state.activity,
				items,
			},
		};
	},
	16: (state): PersistedState => {
		return {
			...state,
			metadata: {
				...state.metadata,
				pendingInvoices: [],
			},
		};
	},
	17: (state): PersistedState => {
		return {
			...state,
			widgets: initialWidgetsState,
		};
	},
	18: (state): PersistedState => {
		return {
			...state,
			ui: {
				...state.ui,
				fromAddressViewer: false,
			},
		};
	},
	19: (state): PersistedState => {
		return {
			...state,
			blocktank: {
				...state.blocktank,
				cJitEntries: [],
			},
		};
	},
	20: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				treasureChests: [],
			},
		};
	},
	21: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				webRelay: __WEB_RELAY__,
			},
		};
	},
	22: (state): PersistedState => {
		return {
			...state,
			slashtags: {
				...state.slashtags,
				lastPaidContacts: [],
			},
		};
	},
	23: (state): PersistedState => {
		return {
			...state,
			todos: initialTodosState,
		};
	},
	24: (state): PersistedState => {
		return {
			...state,
			lightning: {
				...state.lightning,
				accountVersion: 1,
			},
		};
	},
	25: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				isWebRelayTrusted: false,
			},
		};
	},
	26: (state): PersistedState => {
		return {
			...state,
			blocktank: {
				...state.blocktank,
				info: defaultBlocktankInfoShape,
			},
		};
	},
	27: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				isWebRelayTrusted: true,
			},
		};
	},
	28: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				rapidGossipSyncUrl: 'https://rapidsync.lightningdevkit.org/snapshot/',
			},
		};
	},
	29: (state): PersistedState => {
		const newWidgets = { ...state.widgets.widgets };
		const defaultSettings = getDefaultSettings();

		for (const url in state.widgets.widgets) {
			const widget = newWidgets[url]!;
			const isFeedWidget = Object.hasOwn(widget, 'type');

			if (isFeedWidget) {
				widget.extras = {
					...defaultSettings.extras,
					...widget.extras,
				};
			}
		}

		return {
			...state,
			settings: {
				...state.settings,
				showWidgets: true,
			},
			widgets: {
				...state.widgets,
				widgets: newWidgets,
			},
		};
	},
	30: (state): PersistedState => {
		const newNodes = { ...state.lightning.nodes };
		// Loop through all nodes
		for (const walletName in newNodes) {
			newNodes[walletName] = {
				...newNodes[walletName],
				claimableBalances: getNetworkContent([]),
			};
		}

		return {
			...state,
			lightning: {
				...state.lightning,
				nodes: newNodes,
			},
		};
	},
	31: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				enableSwipeToHideBalance: true,
				hideBalanceOnOpen: false,
			},
		};
	},
	32: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				ignoresHideBalanceToast: false,
				ignoresSwitchUnitToast: false,
			},
		};
	},
	33: (state): PersistedState => {
		const widgets = state.widgets.widgets;

		for (const url in widgets) {
			const widget = widgets[url]!;
			const isFeedWidget = Object.hasOwn(widget, 'type');

			if (isFeedWidget && widget.extras.showTitle === undefined) {
				widget.extras.showTitle = true;
			}
		}

		return {
			...state,
			widgets: {
				...state.widgets,
				widgets: widgets,
			},
		};
	},
	34: (state): PersistedState => {
		const walletsState = { ...state.wallet.wallets };
		// Loop through all wallets
		for (const walletName in walletsState) {
			// Add p2tr to the wallet structure, with the initial value set.
			Object.values(EAvailableNetwork).forEach((network) => {
				walletsState[walletName] = {
					...walletsState[walletName],
					addresses: {
						...walletsState[walletName].addresses,
						[network]: {
							...walletsState[walletName].addresses[network],
							[EAddressType.p2tr]: {},
						},
					},
					changeAddresses: {
						...walletsState[walletName].changeAddresses,
						[network]: {
							...walletsState[walletName].changeAddresses[network],
							[EAddressType.p2tr]: {},
						},
					},
					addressIndex: {
						...walletsState[walletName].addressIndex,
						[network]: {
							...walletsState[walletName].addressIndex[network],
							[EAddressType.p2tr]: { ...defaultAddressContent },
						},
					},
					changeAddressIndex: {
						...walletsState[walletName].changeAddressIndex,
						[network]: {
							...walletsState[walletName].changeAddressIndex[network],
							[EAddressType.p2tr]: { ...defaultAddressContent },
						},
					},
					lastUsedAddressIndex: {
						...walletsState[walletName].lastUsedAddressIndex,
						[network]: {
							...walletsState[walletName].lastUsedAddressIndex[network],
							[EAddressType.p2tr]: { ...defaultAddressContent },
						},
					},
					lastUsedChangeAddressIndex: {
						...walletsState[walletName].lastUsedChangeAddressIndex,
						[network]: {
							...walletsState[walletName].lastUsedChangeAddressIndex[network],
							[EAddressType.p2tr]: { ...defaultAddressContent },
						},
					},
				};
			});
		}
		return {
			...state,
			wallet: {
				...state.wallet,
				addressTypesToMonitor:
					getDefaultWalletStoreShape().addressTypesToMonitor,
				wallets: walletsState,
			},
		};
	},
	35: (state): PersistedState => {
		const newNodes = { ...state.lightning.nodes };
		// Loop through all nodes
		for (const walletName in newNodes) {
			newNodes[walletName] = {
				...newNodes[walletName],
				backup: getNetworkContent({}),
			};
		}

		const now = Date.now();
		const old = state.backup;
		const backup = {};

		for (const [oldKey, newKey] of [
			['remoteBlocktankBackup', EBackupCategories.blocktank],
			['remoteLdkActivityBackup', EBackupCategories.ldkActivity],
			['remoteMetadataBackup', EBackupCategories.metadata],
			['remoteSettingsBackup', EBackupCategories.settings],
			['remoteSlashtagsBackup', EBackupCategories.slashtags],
			['remoteWidgetsBackup', EBackupCategories.widgets],
		]) {
			const oldLastSync = old[`${oldKey}LastSync`];
			const oldSynced = old[`${oldKey}Synced`];
			const oldSyncRequired = old[`${oldKey}SyncRequired`];

			if (oldSynced === false && !oldSyncRequired) {
				// backup not required
				backup[newKey] = {
					required: now - 1000,
					synced: now,
					running: false,
				};
			} else {
				// force backup
				backup[newKey] = {
					required: now,
					synced: oldLastSync ?? now - 1000,
					running: false,
				};
			}
		}

		return {
			...state,
			backup,
			lightning: {
				...state.lightning,
				nodes: newNodes,
			},
		};
	},
	36: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				unit: EUnit.BTC,
				denomination: EDenomination.modern,
			},
		};
	},
	37: (state): PersistedState => {
		const newState = { ...state };
		// Loop through all wallets
		for (const walletName in newState.wallet.wallets) {
			// Add transfers to each wallet, with the initial value set.
			newState.wallet.wallets[walletName] = {
				...newState.wallet.wallets[walletName],
				transfers: getNetworkContent([]),
			};
		}
		return newState;
	},
};

export default migrations;
