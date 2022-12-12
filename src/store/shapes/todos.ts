import { ITodo, ITodos } from '../types/todos';

const imageSafe = require('../../assets/illustrations/safe.png');
const imageLightning = require('../../assets/illustrations/lightning.png');
const imageTransfer = require('../../assets/illustrations/transfer.png');
const imageShield = require('../../assets/illustrations/shield.png');
const imageCrown = require('../../assets/illustrations/crown-no-margins.png');
const imageBitcoin = require('../../assets/illustrations/b-emboss.png');

const backupSeedPhraseTodo: ITodo = {
	id: 'backupSeedPhrase',
	title: 'Back up',
	description: 'Store your money',
	color: 'blue',
	image: imageSafe,
	dismissable: true,
};
const lightningTodo: ITodo = {
	id: 'lightning',
	title: 'Pay instantly',
	description: 'Get on Lightning',
	color: 'purple',
	image: imageLightning,
	dismissable: true,
};
const lightningSettingUpTodo: ITodo = {
	id: 'lightningSettingUp',
	title: 'Setting Up',
	description: 'Ready in ±20m',
	color: 'purple',
	image: imageLightning,
	dismissable: false,
};
const transferTodo: ITodo = {
	id: 'transfer',
	title: 'Transfer',
	description: 'Spend or save',
	color: 'purple',
	image: imageTransfer,
	dismissable: true,
};
const transferInProgressTodo: ITodo = {
	id: 'transferInProgress',
	title: 'Transferring',
	description: 'Ready in ±20m',
	color: 'purple',
	image: imageTransfer,
	dismissable: false,
};
const transferClosingChannel: ITodo = {
	id: 'transferClosingChannel',
	title: 'Initiating...',
	description: 'Keep app open',
	color: 'purple',
	image: imageTransfer,
	dismissable: false,
};
const pinTodo: ITodo = {
	id: 'pin',
	title: 'Better security',
	description: 'Set up a PIN code',
	color: 'green',
	image: imageShield,
	dismissable: true,
};
const slashtagsProfileTodo: ITodo = {
	id: 'slashtagsProfile',
	title: 'Public Profile',
	description: 'Add your details',
	color: 'brand',
	image: imageCrown,
	dismissable: true,
};
const buyBitcoinTodo: ITodo = {
	id: 'buyBitcoin',
	title: 'Get Bitcoin',
	description: 'Stack some sats',
	color: 'orange',
	image: imageBitcoin,
	dismissable: true,
};

export const allTodos = [
	backupSeedPhraseTodo,
	lightningTodo,
	lightningSettingUpTodo,
	transferTodo,
	transferInProgressTodo,
	transferClosingChannel,
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
