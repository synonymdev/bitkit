import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { TUser } from '../slices/user';

const userState = (state: RootState): TUser => state.user;

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

export const lightningSettingUpStepSelector = createSelector(
	[userState],
	(user): number => user.lightningSettingUpStep,
);

export const quickpayIntroSeenSelector = (state: RootState): boolean => {
	return state.user.quickpayIntroSeen;
};

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

export const ignoresHideBalanceToastSelector = createSelector(
	[userState],
	(user): boolean => user.ignoresHideBalanceToast,
);

export const ignoresSwitchUnitToastSelector = createSelector(
	[userState],
	(user): boolean => user.ignoresSwitchUnitToast,
);

export const scanAllAddressesTimestampSelector = createSelector(
	[userState],
	(user): number => user.scanAllAddressesTimestamp,
);

export const transferIntroSeenSelector = (state: RootState): boolean => {
	return state.user.transferIntroSeen;
};

export const spendingIntroSeenSelector = (state: RootState): boolean => {
	return state.user.spendingIntroSeen;
};

export const savingsIntroSeenSelector = (state: RootState): boolean => {
	return state.user.savingsIntroSeen;
};
