// NOTE: 'ui' slice is not persisted to storage

import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { initialUiState } from '../shapes/ui';
import {
	TAvailableUpdate,
	TProfileLink,
	TSendTransaction,
	TUiState,
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
	updateProfileLink,
	updateSendTransaction,
	resetUiState,
} = actions;

export default reducer;
