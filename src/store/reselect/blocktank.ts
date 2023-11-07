import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import { IBlocktank, TPaidBlocktankOrders } from '../types/blocktank';
import {
	BtOrderState,
	IBtInfo,
	IBtOrder,
} from '@synonymdev/blocktank-lsp-http-client';

const blocktankState = (state: Store): IBlocktank => state.blocktank;

export const blocktankSelector = (state: Store): IBlocktank => state.blocktank;

export const blocktankInfoSelector = createSelector(
	blocktankState,
	(blocktank): IBtInfo => blocktank.info,
);
export const blocktankOrdersSelector = createSelector(
	blocktankState,
	(blocktank): IBtOrder[] => blocktank.orders,
);
/**
 * Returns a blocktank order for a given order ID.
 */
export const blocktankOrderSelector = createSelector(
	[blocktankState, (_blocktank, orderId: string): string => orderId],
	(blocktank, orderId): IBtOrder => {
		return blocktank.orders.find((o) => o.id === orderId)!;
	},
);
export const blocktankPaidOrdersSelector = createSelector(
	blocktankState,
	(blocktank): TPaidBlocktankOrders => blocktank.paidOrders,
);
export const blocktankPaidOrdersFullSelector = createSelector(
	blocktankState,
	(
		blocktank,
	): {
		created: IBtOrder[];
		expired: IBtOrder[];
		open: IBtOrder[];
		closed: IBtOrder[];
	} => {
		const created: IBtOrder[] = [];
		const expired: IBtOrder[] = [];
		const open: IBtOrder[] = [];
		const closed: IBtOrder[] = [];

		Object.keys(blocktank.paidOrders).forEach((orderId) => {
			const order = blocktank.orders.find(
				// check o._id in the event it was paid for using the old api.
				// @ts-ignore
				(o) => o.id === orderId || o._id === orderId,
			);

			if (!order) {
				return;
			}

			switch (order.state) {
				case BtOrderState.CREATED:
					created.push(order);
					break;
				case BtOrderState.EXPIRED:
					expired.push(order);
					break;
				case BtOrderState.OPEN:
					open.push(order);
					break;
				case BtOrderState.CLOSED:
					closed.push(order);
					break;
			}
		});

		return { created, expired, open, closed };
	},
);
/**
 * Returns a paid blocktank order txid given its order ID.
 */
export const blocktankPaidOrderSelector = createSelector(
	[blocktankState, (_blocktank, orderId: string): string => orderId],
	(blocktank, orderId): string => {
		const paidBlocktankOrders = blocktank.paidOrders;
		if (orderId in paidBlocktankOrders) {
			return paidBlocktankOrders[orderId];
		}
		return '';
	},
);
