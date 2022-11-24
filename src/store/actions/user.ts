import actions from './actions';
import { getDispatch } from '../helpers';
import { ok, Result } from '@synonymdev/result';
import { IViewControllerData, TViewController } from '../types/user';
import { defaultViewController } from '../shapes/user';
import { isGeoBlocked } from '../../utils/blocktank';

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
	if (payload.data.isOpen) {
		// Assign snapPoint to 0
		payload.data.snapPoint = 0;
	} else {
		// Reset viewController state for the provided view.
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

export const ignoreHighBalance = (): Result<string> => {
	dispatch({
		type: actions.USER_IGNORE_HIGH_BALANCE,
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

export const setGeoBlock = async (): Promise<void> => {
	const response = await isGeoBlocked();
	updateUser({ isGeoBlocked: response });
};
