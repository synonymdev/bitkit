import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import { IUser } from '../types/user';

const userState = (state: Store): IUser => state.user;

export const isGeoBlockedSelector = createSelector(
	[userState],
	(user): boolean => user.isGeoBlocked ?? false,
);

export const backupVerifiedSelector = createSelector(
	[userState],
	(user): boolean => user.backupVerified,
);

export const ignoreBackupTimestampSelector = createSelector(
	[userState],
	(user): number => user.ignoreBackupTimestamp,
);

export const requiresRemoteRestoreSelector = createSelector(
	[userState],
	(user): boolean => user.requiresRemoteRestore,
);

export const ignoreHighBalanceTimestampSelector = createSelector(
	[userState],
	(user): number => user.ignoreHighBalanceTimestamp,
);

export const ignoreHighBalanceCountSelector = createSelector(
	[userState],
	(user): number => user.ignoreHighBalanceCount,
);

export const startCoopCloseTimestampSelector = createSelector(
	[userState],
	(user): number => user.startCoopCloseTimestamp,
);

export const ignoreAppUpdateTimestampSelector = createSelector(
	[userState],
	(user): number => user.ignoreAppUpdateTimestamp,
);

export const betaRiskAcceptedSelector = createSelector(
	[userState],
	(user): boolean => user.betaRiskAccepted,
);
