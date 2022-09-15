import actions from './actions';
import { getDispatch } from '../helpers';
import { ok, Result } from '@synonymdev/result';
import { IViewControllerData, TViewController } from '../types/user';
import { defaultViewController } from '../shapes/user';

const dispatch = getDispatch();

export const updateUser = (payload): Result<string> => {
	dispatch({
		type: actions.UPDATE_USER,
		payload,
	});
	return ok('');
};

export const toggleView = (payload: {
	view: TViewController;
	data: IViewControllerData;
}): Result<string> => {
	// Reset viewController state for the provided view.
	if (!payload.data?.isOpen) {
		payload.data = { ...defaultViewController };
	}
	// Assign snapPoint to 0 if not set
	if (payload.data?.isOpen && payload.data?.snapPoint === undefined) {
		payload.data.snapPoint = 0;
	}

	dispatch({
		type: actions.TOGGLE_VIEW,
		payload,
	});
	return ok('');
};

/*
 * This reset the user store to defaultUserShape
 */
export const resetUserStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_USER_STORE,
	});
	return ok('');
};

export const ignoreBackup = (): Result<string> => {
	dispatch({
		type: actions.USER_IGNORE_BACKUP,
		payload: Number(new Date()),
	});
	return ok('');
};

export const verifyBackup = (): Result<string> => {
	dispatch({
		type: actions.USER_VERIFY_BACKUP,
	});
	return ok('');
};
