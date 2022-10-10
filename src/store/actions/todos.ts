import { err, ok, Result } from '@synonymdev/result';
import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { ITodo } from '../types/todos';

const dispatch = getDispatch();

/**
 * Adds a single to-do item.
 */
export const addTodo = (todo: ITodo): Result<string> => {
	dispatch({
		type: actions.ADD_TODO,
		payload: todo,
	});
	return ok(`Successfully added to-do with an id of ${todo?.id}`);
};

/**
 * Removes a to-do item based on its id.
 * @param {string} id
 */
export const removeTodo = (id: string = ''): Result<string> => {
	dispatch({
		type: actions.REMOVE_TODO,
		payload: id,
	});
	return ok(`Successfully removed to-do with an id of ${id}`);
};

/**
 * Calls removeTodo, then adds the id to the dismissed to-do array.
 * @param {ITodo} id
 */
export const dismissTodo = (id: string): Result<string> => {
	// Remove from the current to-do list.
	removeTodo(id);
	// Ensure we haven't already dismissed this to-do.
	const dismissedTodos = getStore()?.todos?.dismissedTodos ?? [];
	if (dismissedTodos.includes(id)) {
		return err(`Dismissed to-do with an id of ${id} already exists.`);
	}
	dispatch({
		type: actions.DISMISS_TODO,
		payload: id,
	});
	return ok(`Successfully dismissed to-do with an id of ${id}`);
};

/**
 * Calls resetTodo, to reset dismissed Todos and Todos.
 */
export const resetTodo = (): Result<string> => {
	dispatch({
		type: actions.RESET_TODO,
		payload: null,
	});
	return ok('Successfully reset to-do');
};
