// NOTE: 'ui' slice is not persisted to storage

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { initialUiState } from '../shapes/ui';
import {
	TUiState,
	TAvailableUpdate,
	TProfileLink,
	ViewControllerParamList,
} from '../types/ui';

export const uiSlice = createSlice({
	name: 'ui',
	initialState: initialUiState,
	reducers: {
		updateUi: (state, action: PayloadAction<Partial<TUiState>>) => {
			state = Object.assign(state, action.payload);
		},
		setAppUpdateInfo: (state, action: PayloadAction<TAvailableUpdate>) => {
			state.availableUpdate = action.payload;
		},
		showSheet: (
			state,
			action: PayloadAction<{
				view: keyof ViewControllerParamList;
				params: any;
			}>,
		) => {
			state.viewControllers[action.payload.view] = {
				...action.payload.params,
				isOpen: true,
			};
		},
		closeSheet: (
			state,
			action: PayloadAction<keyof ViewControllerParamList>,
		) => {
			state.viewControllers[action.payload] = { isOpen: false };
		},
		updateProfileLink: (state, action: PayloadAction<TProfileLink>) => {
			state.profileLink = Object.assign(state.profileLink, action.payload);
		},
		confirmHighFee: (state) => {
			state.hasFeeWarningShown = true;
		},
		resetUiState: () => initialUiState,
	},
});

const { actions, reducer } = uiSlice;

export const {
	updateUi,
	setAppUpdateInfo,
	showSheet,
	closeSheet,
	updateProfileLink,
	confirmHighFee,
	resetUiState,
} = actions;

export default reducer;
