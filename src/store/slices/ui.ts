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
		toggleSheet: (
			state,
			action: PayloadAction<{
				view: keyof ViewControllerParamList;
				params: any;
			}>,
		) => {
			state.viewControllers[action.payload.view] = {
				...action.payload.params,
				isOpen: !state.viewControllers[action.payload.view].isOpen,
				isMounted: true,
			};
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
				isMounted: true,
			};
		},
		closeSheet: (
			state,
			action: PayloadAction<keyof ViewControllerParamList>,
		) => {
			state.viewControllers[action.payload] = {
				isOpen: false,
				isMounted: true,
			};
		},
		updateProfileLink: (state, action: PayloadAction<TProfileLink>) => {
			state.profileLink = Object.assign(state.profileLink, action.payload);
		},
		resetUiState: () => initialUiState,
	},
});

const { actions, reducer } = uiSlice;

export const {
	updateUi,
	setAppUpdateInfo,
	showSheet,
	toggleSheet,
	closeSheet,
	updateProfileLink,
	resetUiState,
} = actions;

export default reducer;
