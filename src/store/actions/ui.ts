import { ok, Result } from '@synonymdev/result';
import { getDispatch } from '../helpers';
import actions from './actions';

const dispatch = getDispatch();

export const updateProfileLink = (payload: {
	title?: string;
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
