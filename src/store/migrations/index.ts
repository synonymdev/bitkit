import { PersistedState } from 'redux-persist';
import { defaultTodosShape } from '../shapes/todos';
import { defaultViewControllers } from '../shapes/ui';
import { ITodo } from '../types/todos';

// add migrations for every persisted store version change
// NOTE: state reconciliation works only 2 levels deep
// see https://github.com/rt2zz/redux-persist#state-reconciler

const migrations = {
	0: (state): PersistedState => {
		return {
			...state,
			todos: defaultTodosShape,
		};
	},
	1: (state): PersistedState => {
		return {
			...state,
			todos: defaultTodosShape,
		};
	},
	2: (state): PersistedState => {
		const sortOrder = Object.keys(state.widgets.widgets);

		return {
			...state,
			widgets: {
				...state.widgets,
				sortOrder,
			},
		};
	},
	3: (state): PersistedState => {
		return {
			...state,
			todos: defaultTodosShape,
			user: {
				...state.user,
				startCoopCloseTimestamp: 0,
				viewController: defaultViewControllers,
			},
		};
	},
	4: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				ignoreAppUpdateTimestamp: 0,
			},
		};
	},
	5: (state): PersistedState => {
		return {
			...state,
			todos: Object.values(state.todos as ITodo[]).map((todo) => todo.id),
		};
	},
};

export default migrations;
