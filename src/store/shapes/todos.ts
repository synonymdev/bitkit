import { ITodo, ITodos } from '../types/todos';

const backupSeedPhraseTodo: ITodo = {
	id: 'backupSeedPhrase',
	title: 'Back up',
	description: 'Store your money',
};
const lightningTodo: ITodo = {
	id: 'lightning',
	title: 'Pay instantly',
	description: 'Get on Lightning',
};
const lightningSettingUpTodo: ITodo = {
	id: 'lightningSettingUp',
	title: 'Setting Up',
	description: 'Ready in ±20min',
};
const pinTodo: ITodo = {
	id: 'pin',
	title: 'Better security',
	description: 'Set up a PIN code',
};
const slashtagsProfileTodo: ITodo = {
	id: 'slashtagsProfile',
	title: 'Public Profile',
	description: 'Add your details',
};
const buyBitcoinTodo: ITodo = {
	id: 'buyBitcoin',
	title: 'Get Bitcoin',
	description: 'Stack some sats',
};

export const allTodos = [
	backupSeedPhraseTodo,
	lightningTodo,
	lightningSettingUpTodo,
	pinTodo,
	slashtagsProfileTodo,
	buyBitcoinTodo,
];

const defaultTodos = [
	backupSeedPhraseTodo,
	lightningTodo,
	pinTodo,
	slashtagsProfileTodo,
	buyBitcoinTodo,
];

export const defaultTodosShape: ITodos = defaultTodos;
