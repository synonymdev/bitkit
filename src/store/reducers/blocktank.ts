import actions from '../actions/actions';
import { defaultBlocktankShape } from '../shapes/blocktank';
import { IBlocktank } from '../types/blocktank';
import { IGetOrderResponse } from '@synonymdev/blocktank-client';

const blocktank = (
	state: IBlocktank = defaultBlocktankShape,
	action,
): IBlocktank => {
	switch (action.type) {
		case actions.UPDATE_BLOCKTANK_SERVICE_LIST:
			return {
				...state,
				serviceList: action.payload,
				serviceListLastUpdated: new Date().getTime(),
			};
		case actions.UPDATE_BLOCKTANK_ORDER:
			//Find existing order and update it if it exists, else append to list
			const updatedOrder: IGetOrderResponse = action.payload;

			let orders = state.orders;
			let existingOrderIndex = -1;
			orders.forEach((o, index) => {
				if (o._id === updatedOrder._id) {
					existingOrderIndex = index;
				}
			});

			if (existingOrderIndex > -1) {
				orders[existingOrderIndex] = updatedOrder;
			} else {
				orders.push(updatedOrder);
			}

			return {
				...state,
				orders,
			};
		case actions.RESET_BLOCKTANK_STORE:
			return { ...defaultBlocktankShape };
		default:
			return state;
	}
};

export default blocktank;
