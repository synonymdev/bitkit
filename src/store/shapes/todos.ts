import { ITodo, ITodos } from '../types/todos';

const backupSeedPhraseTodo: ITodo = {
	id: 'backupSeedPhrase',
	title: 'Back up',
	description: 'Store your money',
	color: 'blue',
	image: require('../../assets/illustrations/safe.png'),
};
const lightningTodo: ITodo = {
	id: 'lightning',
	title: 'Pay instantly',
	description: 'Get on Lightning',
	color: 'purple',
	image: require('../../assets/illustrations/lightning.png'),
};
const lightningSettingUpTodo: ITodo = {
	id: 'lightningSettingUp',
	title: 'Setting Up',
	description: 'Ready in ±20min',
	color: 'purple',
	image: require('../../assets/illustrations/lightning.png'),
};
const transferTodo: ITodo = {
	id: 'transfer',
	title: 'Transfer',
	description: 'Spend or save',
	color: 'purple',
	image: require('../../assets/illustrations/transfer.png'),
};
const pinTodo: ITodo = {
	id: 'pin',
	title: 'Better security',
	description: 'Set up a PIN code',
	color: 'green',
	image: require('../../assets/illustrations/shield.png'),
};
const slashtagsProfileTodo: ITodo = {
	id: 'slashtagsProfile',
	title: 'Public Profile',
	description: 'Add your details',
	color: 'brand',
	image: require('../../assets/illustrations/crown-no-margins.png'),
};
const buyBitcoinTodo: ITodo = {
	id: 'buyBitcoin',
	title: 'Get Bitcoin',
	description: 'Stack some sats',
	color: 'orange',
	image: require('../../assets/illustrations/b-emboss.png'),
};

export const allTodos = [
	backupSeedPhraseTodo,
	lightningTodo,
	lightningSettingUpTodo,
	transferTodo,
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
