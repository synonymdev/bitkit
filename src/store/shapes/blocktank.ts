import { IBlocktank } from '../types/blocktank';
import { IBtInfo } from '@synonymdev/blocktank-lsp-http-client';

export const defaultBlocktankInfoShape: IBtInfo = {
	version: 2,
	nodes: [
		{
			alias: '',
			pubkey: '',
			connectionStrings: [],
		},
	],
	options: {
		minChannelSizeSat: 0,
		maxChannelSizeSat: 50000000,
		minExpiryWeeks: 1,
		maxExpiryWeeks: 12,
		minPaymentConfirmations: 0,
		minHighRiskPaymentConfirmations: 1,
		max0ConfClientBalanceSat: 856487,
		maxClientBalanceSat: 856487,
	},
	versions: {
		http: '0.0.0',
		btc: '0.0.0',
		ln2: '0.0.0',
	},
	onchain: {
		// @ts-ignore enum not exported from blocktank-lsp-http-client
		network: 'mainnet',
		feeRates: {
			fast: 0,
			mid: 0,
			slow: 0,
			isHigh: false,
		},
	},
};

export const initialBlocktankState: IBlocktank = {
	orders: [],
	paidOrders: {},
	info: defaultBlocktankInfoShape,
	cJitEntries: [],
};
