import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import { IWidget, IWidgets } from '../types/widgets';

export const widgetsState = (state: Store): IWidgets => state.widgets;

/**
 * Returns all widgets.
 */
export const widgetsSelector = createSelector(
	[widgetsState],
	(widgets): { [url: string]: IWidget | undefined } => widgets.widgets,
);

/**
 * Return specified widget by url.
 */
export const widgetSelector = createSelector(
	[widgetsState, (_widgets, url: string): string => url],
	(widgets, url): IWidget => widgets[url],
);

export const onboardedWidgetsSelector = createSelector(
	[widgetsState],
	(widgets): boolean => widgets.onboardedWidgets,
);
