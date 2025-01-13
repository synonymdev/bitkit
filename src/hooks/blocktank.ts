import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';
import { useAppSelector } from '../hooks/redux';
import {
	blocktankOrdersSelector,
	blocktankPaidOrdersSelector,
} from '../store/reselect/blocktank';

/**
 * Returns the list of blocktank orders that have been paid.
 * @returns {IBtOrder[]} paid Blocktank orders
 */
export const usePaidBlocktankOrders = (): IBtOrder[] => {
	const orders = useAppSelector(blocktankOrdersSelector);
	const paidOrders = useAppSelector(blocktankPaidOrdersSelector);

	const paidBlocktankOrders = orders.filter((order) => {
		return Object.keys(paidOrders).find((orderId) => orderId === order.id);
	});

	return paidBlocktankOrders;
};
