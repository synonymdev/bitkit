import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IActivity, IActivityItem } from '../types/activity';
import { defaultActivityItemShape } from '../shapes/activity';

const activityState = (state: Store): IActivity => state.activity;

const activityItemsState = (state: Store): IActivityItem[] =>
	state.activity.items;

export const activityItemsSelector = createSelector(
	[activityState],
	(activity): IActivityItem[] => activity.items,
);

/**
 * Returns an individual activity item by the provided id.
 * @param {Store} state
 * @param {string} activityId
 * @returns {string}
 */
export const activityItemSelector = createSelector(
	[
		activityItemsState,
		(activityItems, activityId?: string): string => activityId ?? '',
	],
	(activityItems, activityId): IActivityItem | undefined => {
		return activityItems.find(
			(item) => item?.id === activityId ?? defaultActivityItemShape,
		);
	},
);
