import actions from '../actions/actions';
import { ITodos, TTodoType } from '../types/todos';
import { allTodos, defaultTodosShape } from '../shapes/todos';

const TODO_SORTING_ORDER: TTodoType[] = [
	'backupSeedPhrase',
	'lightning',
	'lightningSettingUp',
	'transfer',
	'pin',
	'slashtagsProfile',
	'buyBitcoin',
];

const todos = (state: ITodos = defaultTodosShape, action): ITodos => {
	switch (action.type) {
		case actions.ADD_TODO: {
			const newTodo = allTodos.find((todo) => todo.id === action.payload)!;
			const newTodos = [...state, newTodo].sort(
				(a, b) =>
					TODO_SORTING_ORDER.indexOf(a.id) - TODO_SORTING_ORDER.indexOf(b.id),
			);
			// make sure there are no duplicates
			const uniqueTodos = [
				...new Map(newTodos.map((item) => [item.id, item])).values(),
			];

			return uniqueTodos;
		}

		case actions.REMOVE_TODO:
			return state.filter((todo) => todo.id !== action.payload);

		case actions.RESET_TODOS:
			return defaultTodosShape;

		default:
			return state;
	}
};

export default todos;
