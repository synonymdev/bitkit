import actions from '../actions/actions';
import { ITodos } from '../types/todos';
import { allTodos, defaultTodosShape, todoSortinOrder } from '../shapes/todos';

const todos = (state: ITodos = defaultTodosShape, action): ITodos => {
	switch (action.type) {
		case actions.ADD_TODO: {
			const newTodo = allTodos.find((todo) => todo.id === action.payload)!.id;
			const uniqueTodos = [...new Set([...state, newTodo])];
			const newTodos = uniqueTodos.sort(
				(a, b) => todoSortinOrder.indexOf(a) - todoSortinOrder.indexOf(b),
			);

			return newTodos;
		}

		case actions.REMOVE_TODO: {
			return state.filter((todo) => todo !== action.payload);
		}

		case actions.RESET_TODOS: {
			return defaultTodosShape;
		}

		default: {
			return state;
		}
	}
};

export default todos;
