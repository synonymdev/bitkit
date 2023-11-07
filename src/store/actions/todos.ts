import { ok, Result } from '@synonymdev/result';
import { TChannel } from '@synonymdev/react-native-ldk';

import actions from './actions';
import { getDispatch } from '../helpers';
import { TTodoType } from '../types/todos';

const dispatch = getDispatch();

export const hideTodo = (id: TTodoType): Result<string> => {
	dispatch({
		type: actions.HIDE_TODO,
		payload: id,
	});
	return ok(`Successfully removed to-do with an id of ${id}`);
};

export const resetHiddenTodos = (): Result<string> => {
	dispatch({ type: actions.RESET_HIDDEN_TODOS });
	return ok('Successfully reset hidden todos');
};

export const channelsNotificationsShown = (
	channels: TChannel[],
): Result<string> => {
	const ids = channels.map((c) => c.channel_id);
	dispatch({
		type: actions.CHANNEL_NOTIFICATION_SHOWN,
		payload: ids,
	});
	return ok('Successfully reset channel notifications');
};

export const resetTodos = (): Result<string> => {
	dispatch({ type: actions.RESET_TODOS });
	return ok('Successfully reset todos');
};
