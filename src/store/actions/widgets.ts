import actions from './actions';
import { getDispatch } from '../helpers';
import {
	IWidgetsStore,
	SlashFeedJSON,
	TWidgetSettings,
} from '../types/widgets';
import { ok, Result } from '@synonymdev/result';

const dispatch = getDispatch();

export const updateWidgets = (
	payload: Partial<IWidgetsStore>,
): Result<string> => {
	dispatch({
		type: actions.UPDATE_WIDGETS,
		payload,
	});
	return ok('');
};

export const setAuthWidget = (
	url: string,
	data: {
		magiclink: boolean;
	},
): void => {
	dispatch({
		type: actions.SET_AUTH_WIDGET,
		payload: {
			url,
			magiclink: data.magiclink,
		},
	});
};

export const setFeedWidget = ({
	url,
	type,
	fields,
	extras,
}: {
	url: string;
	type: string;
	fields: SlashFeedJSON['fields'];
	extras?: TWidgetSettings['extras'];
}): void => {
	dispatch({
		type: actions.SET_FEED_WIDGET,
		payload: {
			url,
			type,
			fields,
			extras,
		},
	});
};

export const deleteWidget = (url: string): void => {
	dispatch({
		type: actions.DELETE_WIDGET,
		payload: { url },
	});
};

export const resetWidgetsStore = (): void => {
	dispatch({ type: actions.RESET_WIDGETS_STORE });
};

export const setWidgetsOnboarding = (onboardedWidgets: boolean): void => {
	dispatch({
		type: actions.SET_WIDGETS_ONBOARDING,
		payload: { onboardedWidgets },
	});
};

export const setWidgetsSortOrder = (sortOrder: number[]): void => {
	dispatch({
		type: actions.SET_WIDGETS_SORT_ORDER,
		payload: { sortOrder },
	});
};
