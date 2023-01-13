import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import { IWidgetsStore, IWidget, IWidgets } from '../types/widgets';

export const widgetsState = (state: Store): IWidgetsStore => state.widgets;

/**
 * Returns all widgets.
 */
export const widgetsSelector = createSelector(
	[widgetsState],
	(widgets): IWidgets => widgets.widgets,
);

/**
 * Return specified widget by url.
 */
export const widgetSelector = createSelector(
	[widgetsState, (_widgets, url: string): string => url],
	(widgets, url): IWidget | undefined => widgets.widgets[url],
);

export const onboardedWidgetsSelector = createSelector(
	[widgetsState],
	(widgets): boolean => widgets.onboardedWidgets,
);
