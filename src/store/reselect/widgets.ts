import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IWidget, IWidgets } from '../types/widgets';

export const widgetsState = (state: Store): IWidgets => state.widgets;

/**
 * Returns all widgets.
 */
export const widgetsSelector = createSelector(
	[widgetsState],
	(widgets): { [url: string]: IWidget } => widgets.widgets,
);

/**
 * Return specified widget by url.
 */
export const widgetSelector = createSelector(
	[widgetsState, (widgets, url: string): string => url],
	(widgets, url): IWidget => widgets[url],
);
