import { IDefaultLightningShape, ILightning } from '../types/lightning';
import {
	arrayTypeItems,
	defaultWalletShape,
	numberTypeItems,
	objectTypeItems,
	stringTypeItems,
} from './wallet';

export const defaultLightningShape: IDefaultLightningShape = {
	nodeId: stringTypeItems,
	info: objectTypeItems,
	channels: objectTypeItems,
	openChannelIds: arrayTypeItems,
	invoices: arrayTypeItems,
	payments: objectTypeItems,
	peers: arrayTypeItems,
	claimableBalance: numberTypeItems,
};

export const defaultLightningStoreShape: ILightning = {
	version: {
		ldk: '',
		c_bindings: '',
	},
	nodes: {
		[defaultWalletShape.id]: defaultLightningShape,
	},
};
