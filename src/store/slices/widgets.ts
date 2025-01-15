import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { TWidgets } from '../types/widgets';

export type TWidgetsState = {
	widgets: TWidgets;
	onboardedWidgets: boolean;
	sortOrder: string[];
};

export const initialWidgetsState: TWidgetsState = {
	widgets: {},
	onboardedWidgets: false,
	sortOrder: [],
};

export const widgetsSlice = createSlice({
	name: 'widgets',
	initialState: initialWidgetsState,
	reducers: {
		updateWidgets: (state, action: PayloadAction<Partial<TWidgetsState>>) => {
			state = Object.assign(state, action.payload);
		},
		saveWidget: (
			state,
			action: PayloadAction<{ id: string; options?: any }>,
		) => {
			const { id, options } = action.payload;
			state.sortOrder.push(id);
			state.widgets[id] = options ?? null;
		},
		deleteWidget: (state, action: PayloadAction<string>) => {
			delete state.widgets[action.payload];
			state.sortOrder = state.sortOrder.filter((i) => i !== action.payload);
		},
		setWidgetsOnboarding: (state, action: PayloadAction<boolean>) => {
			state.onboardedWidgets = action.payload;
		},
		setWidgetsSortOrder: (state, action: PayloadAction<string[]>) => {
			state.sortOrder = action.payload;
		},
		resetWidgetsState: () => initialWidgetsState,
	},
});

const { actions, reducer } = widgetsSlice;

export const {
	updateWidgets,
	saveWidget,
	deleteWidget,
	setWidgetsOnboarding,
	setWidgetsSortOrder,
	resetWidgetsState,
} = actions;

export default reducer;
