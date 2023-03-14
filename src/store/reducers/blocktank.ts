import actions from '../actions/actions';
import { defaultBlocktankShape } from '../shapes/blocktank';
import { IBlocktank } from '../types/blocktank';

const blocktank = (
	state: IBlocktank = defaultBlocktankShape,
	action,
): IBlocktank => {
	switch (action.type) {
		case actions.UPDATE_BLOCKTANK_INFO:
			return {
				...state,
				info: action.payload,
			};

		case actions.UPDATE_BLOCKTANK_SERVICE_LIST:
			return {
				...state,
				serviceList: action.payload,
				serviceListLastUpdated: new Date().getTime(),
			};

		case actions.UPDATE_BLOCKTANK_ORDER: {
			// Find existing order and update it if it exists, else append to list
			const existingOrder = state.orders.find(
				(order) => order._id === action.payload._id,
			);

			if (existingOrder) {
				const updatedOrders = state.orders.map((order) => {
					if (order._id === action.payload._id) {
						return action.payload;
					}

					return order;
				});

				return {
					...state,
					orders: updatedOrders,
				};
			} else {
				return {
					...state,
					orders: [...state.orders, action.payload],
				};
			}
		}

		case actions.ADD_PAID_BLOCKTANK_ORDER:
			return {
				...state,
				paidOrders: {
					...state.paidOrders,
					[action.payload.orderId]: action.payload.txid,
				},
			};

		case actions.UPDATE_BLOCKTANK:
			return {
				...state,
				...action.payload,
			};

		case actions.RESET_BLOCKTANK_STORE:
			return defaultBlocktankShape;

		default:
			return state;
	}
};

export default blocktank;
