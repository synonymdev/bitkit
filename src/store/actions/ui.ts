import { ok, Result } from '@synonymdev/result';

import { getDispatch } from '../helpers';
import actions from './actions';
import { IViewControllerData, TViewController } from '../types/ui';
import { defaultViewController } from '../shapes/ui';

const dispatch = getDispatch();

export const toggleView = (payload: {
	view: TViewController;
	data: IViewControllerData;
}): Result<string> => {
	if (!payload.data.isOpen) {
		// close view and reset viewController state
		payload.data = defaultViewController;
	}

	dispatch({
		type: actions.TOGGLE_VIEW,
		payload,
	});
	return ok('');
};

export const closeAllViews = (): Result<string> => {
	dispatch({ type: actions.CLOSE_VIEWS });
	return ok('');
};

export const updateProfileLink = (payload: {
	title: string;
	url?: string;
}): Result<string> => {
	dispatch({
		type: actions.UPDATE_PROFILE_LINK,
		payload,
	});
	return ok('');
};

/*
 * This reset the user store to defaultUserShape
 */
export const resetUiStore = (): Result<string> => {
	dispatch({ type: actions.RESET_UI_STORE });
	return ok('');
};
