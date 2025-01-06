import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { mergeActivityItems } from '../../utils/activity';
import { IActivityItem } from '../types/activity';

export type TActivity = { items: IActivityItem[] };

export const initialActivityState: TActivity = { items: [] };

export const activitySlice = createSlice({
	name: 'activity',
	initialState: initialActivityState,
	reducers: {
		addActivityItem: (state, action: PayloadAction<IActivityItem>) => {
			state.items.unshift(action.payload);
		},
		addActivityItems: (state, action: PayloadAction<IActivityItem[]>) => {
			state.items.unshift(...action.payload);
		},
		updateActivityItems: (state, action: PayloadAction<IActivityItem[]>) => {
			state.items = mergeActivityItems(state.items, action.payload);
		},
		removeActivityItem: (state, action: PayloadAction<string>) => {
			state.items = state.items.filter((item) => item.id !== action.payload);
		},
		resetActivityState: () => initialActivityState,
	},
});

const { actions, reducer } = activitySlice;

export const {
	addActivityItem,
	addActivityItems,
	updateActivityItems,
	removeActivityItem,
	resetActivityState,
} = actions;

export default reducer;
