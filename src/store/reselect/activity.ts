import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { IActivityItem } from '../types/activity';
import { createShallowEqualSelector } from './utils';
import { TActivity } from '../slices/activity';

export const activitySelector = (state: RootState): TActivity => {
	return state.activity;
};

export const activityItemsSelector = createShallowEqualSelector(
	[(state): TActivity => state.activity],
	(activity): IActivityItem[] => activity.items,
);

/**
 * Returns an individual activity item by the provided id.
 * @param {RootState} state
 * @param {string} activityId
 * @returns {string}
 */
export const activityItemSelector = createSelector(
	[activityItemsSelector, (_state, activityId: string): string => activityId],
	(activityItems, activityId): IActivityItem | undefined => {
		return activityItems.find((item) => item.id === activityId);
	},
);
