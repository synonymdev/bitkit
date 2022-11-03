import actions from './actions';
import { getDispatch } from '../helpers';
import { IWidget } from '../types/widgets';

const dispatch = getDispatch();

export const setAuthWidget = (
	url: string,
	data: {
		magiclink: boolean;
	},
): void => {
	dispatch({
		type: actions.SET_SLASHTAGS_AUTH_WIDGET,
		payload: {
			url,
			magiclink: data.magiclink,
		},
	});
};

export const setFeedWidget = (url: string, feed: IWidget['feed']): void => {
	dispatch({
		type: actions.SET_SLASHTAGS_FEED_WIDGET,
		payload: {
			url,
			feed,
		},
	});
};

export const deleteWidget = (url: string): void => {
	dispatch({
		type: actions.DELETE_SLASHTAGS_WIDGET,
		payload: { url },
	});
};

export const resetWidgetsStore = (): void => {
	dispatch({ type: actions.RESET_WIDGETS_STORE });
};

export const setWidgetsOnboarding = (onboardedWidgets: boolean): void => {
	dispatch({
		type: actions.SET_WIDGETS_ONBAORDING,
		payload: { onboardedWidgets },
	});
};
