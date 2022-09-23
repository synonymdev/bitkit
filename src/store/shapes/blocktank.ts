import { IBlocktank } from '../types/blocktank';
import { IGetOrderResponse } from '@synonymdev/blocktank-client';

export const defaultBlocktankInfoShape = {
	capacity: {
		local_balance: 0,
		remote_balance: 0,
	},
	services: [],
	node_info: {
		alias: '',
		active_channels_count: 0,
		uris: [],
		public_key: '',
	},
};

export const defaultBlocktankShape: IBlocktank = {
	serviceList: [],
	serviceListLastUpdated: undefined,
	orders: [],
	info: defaultBlocktankInfoShape,
};

export const defaultOrderResponse: IGetOrderResponse = {
	_id: '',
	local_balance: 0,
	remote_balance: 0,
	channel_expiry: 0,
	channel_open_tx: {
		transaction_id: '',
		transaction_vout: 0,
	},
	channel_expiry_ts: 0,
	order_expiry: 0,
	price: 0,
	total_amount: 0,
	btc_address: '',
	created_at: 0,
	state: 0,
	stateMessage: '',
	purchase_invoice: '',
	amount_received: 0,
	onchain_payments: [],
	lnurl_decoded: {
		uri: '',
		callback: '',
		k1: '',
		tag: '',
	},
	lnurl_string: '',
	remote_node_uri: '',
	remote_node_src: '',
	zero_conf_satvbyte: 0,
	zero_conf_satvbyte_expiry: 0,
	renewals: [],
};
