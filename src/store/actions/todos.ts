import { ok, Result } from '@synonymdev/result';
import actions from './actions';
import { getDispatch } from '../helpers';
import { TTodoType } from '../types/todos';

const dispatch = getDispatch();

/**
 * Adds a single to-do item.
 * @param {TTodoType} id
 */
export const addTodo = (id: TTodoType): Result<string> => {
	dispatch({
		type: actions.ADD_TODO,
		payload: id,
	});
	return ok(`Successfully added to-do with an id of ${id}`);
};

/**
 * Removes a to-do item based on its id.
 * @param {TTodoType} id
 */
export const removeTodo = (id: TTodoType): Result<string> => {
	dispatch({
		type: actions.REMOVE_TODO,
		payload: id,
	});
	return ok(`Successfully removed to-do with an id of ${id}`);
};

/**
 * Resets todos to initial state.
 */
export const resetTodos = (): Result<string> => {
	dispatch({ type: actions.RESET_TODOS });
	return ok('Successfully reset todos');
};
