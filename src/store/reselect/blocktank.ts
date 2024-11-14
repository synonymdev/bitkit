import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { IBlocktank, TPaidBlocktankOrders } from '../types/blocktank';
import {
	BtOrderState2,
	IBtInfo,
	IBtOrder,
} from '@synonymdev/blocktank-lsp-http-client';

const blocktankState = (state: RootState): IBlocktank => state.blocktank;

export const blocktankSelector = (state: RootState): IBlocktank => {
	return state.blocktank;
};

export const blocktankInfoSelector = createSelector(
	[blocktankState],
	(blocktank): IBtInfo => blocktank.info,
);

export const blocktankNodeIdsSelector = createSelector(
	[blocktankState],
	(blocktank): string[] => {
		const { nodes } = blocktank.info;
		const nodeIds = nodes.map((node) => node.pubkey);
		return nodeIds;
	},
);

export const blocktankOrdersSelector = createSelector(
	[blocktankState],
	(blocktank): IBtOrder[] => blocktank.orders,
);

/**
 * Returns a blocktank order for a given order ID.
 */
export const blocktankOrderSelector = createSelector(
	[blocktankState, (_state, orderId: string): string => orderId],
	(blocktank, orderId): IBtOrder => {
		return blocktank.orders.find((o) => o.id === orderId)!;
	},
);
export const blocktankPaidOrdersSelector = createSelector(
	[blocktankState],
	(blocktank): TPaidBlocktankOrders => blocktank.paidOrders,
);
export const blocktankPaidOrdersFullSelector = createSelector(
	[blocktankState],
	(
		blocktank,
	): {
		created: IBtOrder[];
		expired: IBtOrder[];
		executed: IBtOrder[];
		paid: IBtOrder[];
	} => {
		const created: IBtOrder[] = [];
		const expired: IBtOrder[] = [];
		const executed: IBtOrder[] = [];
		const paid: IBtOrder[] = [];

		Object.keys(blocktank.paidOrders).forEach((orderId) => {
			const order = blocktank.orders.find((o) => o.id === orderId);

			if (!order) {
				return;
			}

			switch (order.state2) {
				case BtOrderState2.CREATED:
					created.push(order);
					break;
				case BtOrderState2.EXPIRED:
					expired.push(order);
					break;
				case BtOrderState2.EXECUTED:
					executed.push(order);
					break;
				case BtOrderState2.PAID:
					paid.push(order);
					break;
			}
		});

		return { created, expired, executed, paid };
	},
);
/**
 * Returns a paid blocktank order txid given its order ID.
 */
export const blocktankPaidOrderSelector = createSelector(
	[blocktankState, (_state, orderId: string): string => orderId],
	(blocktank, orderId): string => {
		const paidBlocktankOrders = blocktank.paidOrders;
		if (orderId in paidBlocktankOrders) {
			return paidBlocktankOrders[orderId];
		}
		return '';
	},
);

/**
 * Returns the list of CJIT entries.
 */
export const cjitEntriesSelector = createSelector(
	[blocktankState],
	(blocktank) => blocktank.cJitEntries,
);
