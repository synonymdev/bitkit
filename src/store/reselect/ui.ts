import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { TBackupItem } from '../types/backup';
import { EBackupCategory } from '../types/backup';
import { THealthState, TProfileLink, TSendTransaction } from '../types/ui';
import { backupSelector } from './backup';
import { blocktankPaidOrdersFullSelector } from './blocktank';
import { openChannelsSelector, pendingChannelsSelector } from './lightning';

export const profileLinkSelector = (state: RootState): TProfileLink => {
	return state.ui.profileLink;
};

export const isAuthenticatedSelector = (state: RootState): boolean => {
	return state.ui.isAuthenticated;
};

export const isOnlineSelector = (state: RootState): boolean => {
	return state.ui.isOnline;
};

export const isLDKReadySelector = (state: RootState): boolean => {
	return state.ui.isLDKReady;
};

export const isConnectedToElectrumSelector = (state: RootState): boolean => {
	return state.ui.isConnectedToElectrum;
};

export const isElectrumThrottledSelector = (state: RootState): boolean => {
	return state.ui.isElectrumThrottled;
};

export const appStateSelector = (state: RootState) => {
	return state.ui.appState;
};

export const availableUpdateSelector = (state: RootState) => {
	return state.ui.availableUpdate;
};

export const criticalUpdateSelector = (state: RootState): boolean => {
	return state.ui.availableUpdate?.critical ?? false;
};

export const timeZoneSelector = (state: RootState): string => {
	return state.ui.timeZone;
};

export const languageSelector = (state: RootState): string => {
	return state.ui.language;
};

export const sendTransactionSelector = (state: RootState): TSendTransaction => {
	return state.ui.sendTransaction;
};

export const internetStatusSelector = (state: RootState): THealthState => {
	return state.ui.isOnline ? 'ready' : 'error';
};

export const electrumStatusSelector = (state: RootState): THealthState => {
	const { isOnline, isConnectedToElectrum, isElectrumThrottled } = state.ui;
	if (isOnline && !isConnectedToElectrum && !isElectrumThrottled) {
		return 'pending';
	}
	return isConnectedToElectrum ? 'ready' : 'error';
};

export const nodeStatusSelector = (state: RootState): THealthState => {
	const { isOnline, isLDKReady } = state.ui;
	return isOnline && isLDKReady ? 'ready' : 'error';
};

export const channelsStatusSelector = (state: RootState): THealthState => {
	const { isOnline } = state.ui;
	const openChannels = openChannelsSelector(state);
	const pendingChannels = pendingChannelsSelector(state);
	const paidOrders = blocktankPaidOrdersFullSelector(state);

	if (!isOnline) {
		return 'error';
	}
	if (openChannels.length > 0) {
		return 'ready';
	}
	if (
		pendingChannels.length > 0 ||
		Object.keys(paidOrders.created).length > 0
	) {
		return 'pending';
	}
	return 'error';
};

export const backupStatusSelector = createSelector(
	[backupSelector],
	(backup): THealthState => {
		const now = new Date().getTime();
		const FAILED_BACKUP_CHECK_TIME = 300000; // 5 minutes in milliseconds

		const isSyncOk = (b: TBackupItem): boolean => {
			return (
				b.synced > b.required || now - b.required < FAILED_BACKUP_CHECK_TIME
			);
		};

		const isBackupSyncOk = Object.values(EBackupCategory).every((key) => {
			return isSyncOk(backup[key]);
		});

		return isBackupSyncOk ? 'ready' : 'error';
	},
);

/**
 * Returns a combined status of all app components.
 * Returns 'ready' if all components are ready,
 * 'pending' if any component is pending and none are in error,
 * 'error' if any component is in error state.
 * // NOTE: We ignore channels for the global app status
 */
export const appStatusSelector = createSelector(
	[
		internetStatusSelector,
		electrumStatusSelector,
		nodeStatusSelector,
		backupStatusSelector,
	],
	(internetState, electrumState, nodeState, backupState): THealthState => {
		const states = [internetState, electrumState, nodeState, backupState];

		if (states.some((state) => state === 'error')) {
			return 'error';
		}
		if (states.some((state) => state === 'pending')) {
			return 'pending';
		}
		return 'ready';
	},
);
