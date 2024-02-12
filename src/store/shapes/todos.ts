import { ITodo, TTodosState } from '../types/todos';

const imageSafe = require('../../assets/illustrations/safe.png');
const imageLightning = require('../../assets/illustrations/lightning.png');
const imageTransfer = require('../../assets/illustrations/transfer.png');
const imageShield = require('../../assets/illustrations/shield.png');
const imageCrown = require('../../assets/illustrations/crown-no-margins.png');
const imageBitcoin = require('../../assets/illustrations/b-emboss.png');

export const backupSeedPhraseTodo: ITodo = {
	id: 'backupSeedPhrase',
	color: 'blue',
	image: imageSafe,
	dismissable: true,
};
export const lightningTodo: ITodo = {
	id: 'lightning',
	color: 'purple',
	image: imageLightning,
	dismissable: true,
};
export const lightningSettingUpTodo: ITodo = {
	id: 'lightningSettingUp',
	color: 'purple',
	image: imageLightning,
	dismissable: false,
};
export const lightningReadyTodo: ITodo = {
	id: 'lightningReady',
	color: 'purple',
	image: imageLightning,
	dismissable: false,
};
export const transferPendingTodo: ITodo = {
	id: 'transferPending',
	color: 'purple',
	image: imageTransfer,
	dismissable: false,
};
export const transferClosingChannelTodo: ITodo = {
	id: 'transferClosingChannel',
	color: 'purple',
	image: imageTransfer,
	dismissable: false,
};
export const pinTodo: ITodo = {
	id: 'pin',
	color: 'green',
	image: imageShield,
	dismissable: true,
};
export const slashtagsProfileTodo: ITodo = {
	id: 'slashtagsProfile',
	color: 'brand',
	image: imageCrown,
	dismissable: true,
};
export const buyBitcoinTodo: ITodo = {
	id: 'buyBitcoin',
	color: 'orange',
	image: imageBitcoin,
	dismissable: true,
};
export const btFailedTodo: ITodo = {
	id: 'btFailed',
	color: 'gray',
	image: imageLightning,
	dismissable: true,
};

export const initialTodosState: TTodosState = {
	hide: {},
	newChannelsNotifications: {},
};
