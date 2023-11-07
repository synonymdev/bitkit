import { useSelector } from 'react-redux';
import {
	blocktankOrdersSelector,
	blocktankPaidOrdersSelector,
} from '../store/reselect/blocktank';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';

/**
 * Returns the list of blocktank orders that have been paid.
 * @returns {IBtOrder[]} paid Blocktank orders
 */
export const usePaidBlocktankOrders = (): IBtOrder[] => {
	const orders = useSelector(blocktankOrdersSelector);
	const paidOrders = useSelector(blocktankPaidOrdersSelector);

	const paidBlocktankOrders = orders.filter((order) => {
		return Object.keys(paidOrders).find((orderId) => orderId === order.id);
	});

	return paidBlocktankOrders;
};
