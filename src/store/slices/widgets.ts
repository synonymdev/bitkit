import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SlashFeedJSON, TWidgetSettings, TWidgets } from '../types/widgets';

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
		setFeedWidget: (
			state,
			action: PayloadAction<{
				url: string;
				type: string;
				fields: SlashFeedJSON['fields'];
				extras?: TWidgetSettings['extras'];
			}>,
		) => {
			const { url, ...widget } = action.payload;
			state.sortOrder.push(url);
			state.widgets[url] = widget;
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
	setFeedWidget,
	deleteWidget,
	setWidgetsOnboarding,
	setWidgetsSortOrder,
	resetWidgetsState,
} = actions;

export default reducer;
