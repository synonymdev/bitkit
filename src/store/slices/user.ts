// NOTE: 'user' slice is persisted to storage, but not included in remote backup

import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const MAX_WARNINGS = 3; // how many times to show high balance warning

export type TUser = {
	ignoreAppUpdateTimestamp: number;
	ignoreBackupTimestamp: number;
	ignoreHighBalanceCount: number;
	ignoreHighBalanceTimestamp: number;
	isGeoBlocked: boolean;
	lightningSettingUpStep: number;
	requiresRemoteRestore: boolean;
	startCoopCloseTimestamp: number;
	ignoresHideBalanceToast: boolean;
	ignoresSwitchUnitToast: boolean;
	scanAllAddressesTimestamp: number;
};

export const initialUserState: TUser = {
	ignoreAppUpdateTimestamp: 0,
	ignoreBackupTimestamp: 0,
	ignoreHighBalanceCount: 0,
	ignoreHighBalanceTimestamp: 0,
	isGeoBlocked: false,
	lightningSettingUpStep: 0,
	requiresRemoteRestore: false,
	startCoopCloseTimestamp: 0,
	ignoresHideBalanceToast: false,
	ignoresSwitchUnitToast: false,
	scanAllAddressesTimestamp: 0,
};

export const userSlice = createSlice({
	name: 'user',
	initialState: initialUserState,
	reducers: {
		updateUser: (state, action: PayloadAction<Partial<TUser>>) => {
			state = Object.assign(state, action.payload);
		},
		ignoreAppUpdate: (state) => {
			state.ignoreAppUpdateTimestamp = Number(new Date());
		},
		ignoreBackup: (state) => {
			state.ignoreBackupTimestamp = Number(new Date());
		},
		ignoreHighBalance: (state, action: PayloadAction<boolean>) => {
			const increment = action.payload ? MAX_WARNINGS : 1;
			state.ignoreHighBalanceCount += increment;
			state.ignoreHighBalanceTimestamp = Number(new Date());
		},
		setLightningSetupStep: (state, action: PayloadAction<number>) => {
			state.lightningSettingUpStep = action.payload;
		},
		startCoopCloseTimer: (state) => {
			state.startCoopCloseTimestamp = Number(new Date());
		},
		clearCoopCloseTimer: (state) => {
			state.startCoopCloseTimestamp = 0;
		},
		ignoreHideBalanceToast: (state) => {
			state.ignoresHideBalanceToast = true;
		},
		ignoreSwitchUnitToast: (state) => {
			state.ignoresSwitchUnitToast = true;
		},
		resetUserState: () => initialUserState,
	},
});

const { actions, reducer } = userSlice;

export const {
	updateUser,
	ignoreAppUpdate,
	ignoreBackup,
	ignoreHighBalance,
	setLightningSetupStep,
	startCoopCloseTimer,
	clearCoopCloseTimer,
	ignoreHideBalanceToast,
	ignoreSwitchUnitToast,
	resetUserState,
} = actions;

export default reducer;
