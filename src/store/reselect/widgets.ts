import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { TWidgetsState } from '../slices/widgets';
import { TWidgetOptions, TWidgets } from '../types/widgets';

export const widgetsState = (state: RootState): TWidgetsState => state.widgets;

export const widgetsSelector = createSelector(
	[widgetsState],
	(widgets): TWidgets => widgets.widgets,
);

/**
 * Return specified widget by id
 */
export const widgetSelector = createSelector(
	[widgetsState, (_state, id: string): string => id],
	(widgets, id): TWidgetOptions | undefined => widgets.widgets[id],
);

export const widgetsOrderSelector = createSelector(
	[widgetsState],
	(widgets) => widgets.sortOrder,
);

export const hasWidgetsSelector = (state: RootState): boolean => {
	return Object.keys(state.widgets.widgets).length > 0;
};

export const onboardedWidgetsSelector = (state: RootState): boolean => {
	return state.widgets.onboardedWidgets;
};
