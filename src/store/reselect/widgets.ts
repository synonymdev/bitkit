import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { TWidgetsState } from '../slices/widgets';
import { TWidget, TWidgets } from '../types/widgets';

export const widgetsState = (state: RootState): TWidgetsState => state.widgets;

/**
 * Returns all widgets.
 */
export const widgetsSelector = createSelector(
	[widgetsState],
	(widgets): TWidgets => widgets.widgets,
);

/**
 * Return specified widget by url.
 */
export const widgetSelector = createSelector(
	[widgetsState, (_state, url: string): string => url],
	(widgets, url): TWidget | undefined => widgets.widgets[url],
);

export const widgetsOrderSelector = createSelector(
	[widgetsState],
	(widgets) => widgets.sortOrder,
);

export const onboardedWidgetsSelector = (state: RootState): boolean => {
	return state.widgets.onboardedWidgets;
};
