import { IDefaultLightningShape, ILightning } from '../types/lightning';
import { defaultWalletShape, getNetworkContent } from './wallet';

export const defaultLightningShape: IDefaultLightningShape = {
	nodeId: getNetworkContent(''),
	info: getNetworkContent({}),
	channels: getNetworkContent({}),
	openChannelIds: getNetworkContent([]),
	invoices: getNetworkContent([]),
	payments: getNetworkContent({}),
	peers: getNetworkContent([]),
	claimableBalance: getNetworkContent(0),
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
