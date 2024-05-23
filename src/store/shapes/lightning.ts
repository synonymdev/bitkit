import { TLightningState, TNode } from '../types/lightning';
import { defaultWalletShape, getNetworkContent } from './wallet';

export const defaultLightningShape: TNode = {
	nodeId: getNetworkContent(''),
	info: getNetworkContent({}),
	channels: getNetworkContent({}),
	peers: getNetworkContent([]),
	backup: getNetworkContent({}),
};

export const initialLightningState: TLightningState = {
	accountVersion: 3,
	version: {
		ldk: '',
		c_bindings: '',
	},
	nodes: {
		[defaultWalletShape.name]: defaultLightningShape,
	},
	pendingPayments: [],
};
