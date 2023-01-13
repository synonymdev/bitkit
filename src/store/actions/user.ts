import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import { getDispatch } from '../helpers';
import { isGeoBlocked } from '../../utils/blocktank';
import { IUser } from '../types/user';

const dispatch = getDispatch();

export const updateUser = (payload: Partial<IUser>): Result<string> => {
	dispatch({
		type: actions.UPDATE_USER,
		payload,
	});
	return ok('');
};

export const ignoreAppUpdate = (): Result<string> => {
	dispatch({ type: actions.IGNORE_APP_UPDATE });
	return ok('');
};

export const ignoreBackup = (): Result<string> => {
	dispatch({ type: actions.IGNORE_BACKUP });
	return ok('');
};

export const ignoreHighBalance = (final = false): Result<string> => {
	dispatch({
		type: actions.IGNORE_HIGH_BALANCE,
		payload: { final },
	});
	return ok('');
};

export const startCoopCloseTimer = (): Result<string> => {
	dispatch({ type: actions.START_COOP_CLOSE_TIMER });
	return ok('');
};

export const verifyBackup = (): Result<string> => {
	dispatch({ type: actions.VERIFY_BACKUP });
	return ok('');
};

export const setGeoBlock = async (): Promise<void> => {
	const response = await isGeoBlocked();
	updateUser({ isGeoBlocked: response });
};

/*
 * This reset the user store to defaultUserShape
 */
export const resetUserStore = (): Result<string> => {
	dispatch({ type: actions.RESET_USER_STORE });
	return ok('');
};
