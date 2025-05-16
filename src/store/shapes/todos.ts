import { ITodo, TTodosState } from '../types/todos';

const imageSafe = require('../../assets/illustrations/safe.png');
const imageLightning = require('../../assets/illustrations/lightning.png');
const imageTransfer = require('../../assets/illustrations/transfer.png');
const imageShield = require('../../assets/illustrations/shield.png');
const imageCrown = require('../../assets/illustrations/crown-no-margins.png');
const imageLightbulb = require('../../assets/illustrations/lightbulb.png');
const imageBitcoin = require('../../assets/illustrations/b-emboss.png');
const imageGift = require('../../assets/illustrations/gift.png');
const imageGroup = require('../../assets/illustrations/group.png');
const imageFastForward = require('../../assets/illustrations/fast-forward.png');
const imageBag = require('../../assets/illustrations/shopping-bag.png');

export const backupSeedPhraseTodo: ITodo = {
	id: 'backupSeedPhrase',
	color: 'blue24',
	image: imageSafe,
	dismissable: true,
};
export const discountTodo: ITodo = {
	id: 'discount',
	color: 'purple24',
	image: imageGift,
	dismissable: true,
};
export const inviteTodo: ITodo = {
	id: 'invite',
	color: 'blue24',
	image: imageGroup,
	dismissable: true,
};
export const lightningTodo: ITodo = {
	id: 'lightning',
	color: 'purple24',
	image: imageLightning,
	dismissable: true,
};
export const lightningSettingUpTodo: ITodo = {
	id: 'lightningSettingUp',
	color: 'purple24',
	image: imageTransfer,
	dismissable: false,
};
export const lightningReadyTodo: ITodo = {
	id: 'lightningReady',
	color: 'purple24',
	image: imageLightning,
	dismissable: false,
};
export const quickpayTodo: ITodo = {
	id: 'quickpay',
	color: 'green24',
	image: imageFastForward,
	dismissable: true,
};
export const shopTodo: ITodo = {
	id: 'shop',
	color: 'yellow24',
	image: imageBag,
	dismissable: true,
};
export const transferPendingTodo: ITodo = {
	id: 'transferPending',
	color: 'brand24',
	image: imageTransfer,
	dismissable: false,
};
export const transferClosingChannelTodo: ITodo = {
	id: 'transferClosingChannel',
	color: 'brand24',
	image: imageTransfer,
	dismissable: false,
};
export const pinTodo: ITodo = {
	id: 'pin',
	color: 'green24',
	image: imageShield,
	dismissable: true,
};
export const slashtagsProfileTodo: ITodo = {
	id: 'slashtagsProfile',
	color: 'brand24',
	image: imageCrown,
	dismissable: true,
};
export const supportTodo: ITodo = {
	id: 'support',
	color: 'yellow24',
	image: imageLightbulb,
	dismissable: true,
};
export const buyBitcoinTodo: ITodo = {
	id: 'buyBitcoin',
	color: 'brand24',
	image: imageBitcoin,
	dismissable: true,
};
export const btFailedTodo: ITodo = {
	id: 'btFailed',
	color: 'purple24',
	image: imageLightning,
	dismissable: true,
};

export const initialTodosState: TTodosState = {
	hide: {},
	newChannelsNotifications: {},
};
