// NOTE: 'ui' slice is not persisted to storage

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { initialUiState } from '../shapes/ui';
import {
	TAvailableUpdate,
	TProfileLink,
	TSendTransaction,
	TUiState,
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
			const isOpen = state.viewControllers[action.payload.view]?.isOpen;
			if (!isOpen) {
				state.viewControllers[action.payload.view] = {
					...action.payload.params,
					isOpen: true,
					isMounted: true,
				};
			}
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
		updateSendTransaction: (
			state,
			action: PayloadAction<Partial<TSendTransaction>>,
		) => {
			state.sendTransaction = Object.assign(
				state.sendTransaction,
				action.payload,
			);
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
	updateSendTransaction,
	resetUiState,
} = actions;

export default reducer;
