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
