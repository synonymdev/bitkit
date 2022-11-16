import { PersistedState } from 'redux-persist';
import { defaultTodosShape } from '../shapes/todos';

// add migrations for every persisted store version change

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
};

export default migrations;
