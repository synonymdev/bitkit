import actions from '../actions/actions';
import { defaultBlocktankShape } from '../shapes/blocktank';
import { IBlocktank } from '../types/blocktank';
import { IBtOrder, ICJitEntry } from '@synonymdev/blocktank-lsp-http-client';

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

		case actions.UPDATE_BLOCKTANK_ORDER: {
			// Find existing order and update it if it exists, else append to list
			const existingOrder = state.orders.find(
				(order) => order.id === action.payload.id,
			);

			if (existingOrder) {
				const updatedOrders: IBtOrder[] = state.orders.map((order) => {
					if (order.id === action.payload.id) {
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

		case actions.UPDATE_CJIT_ENTRY: {
			// Find existing order and update it if it exists, else append to list
			const existingEntry = state.cJitEntries.find(
				(order) => order.id === action.payload.id,
			);

			if (existingEntry) {
				const updatedEntries: ICJitEntry[] = state.cJitEntries.map((entry) => {
					if (entry.id === action.payload.id) {
						return action.payload;
					}
					return entry;
				});

				return {
					...state,
					cJitEntries: updatedEntries,
				};
			} else {
				return {
					...state,
					cJitEntries: [...state.cJitEntries, action.payload],
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

		case actions.ADD_CJIT_ENTRY:
			return {
				...state,
				cJitEntries: [...state.cJitEntries, action.payload],
			};

		case actions.UPDATE_BLOCKTANK:
			return {
				...state,
				...action.payload,
			};

		case actions.RESET_BLOCKTANK_ORDERS:
			return {
				...state,
				orders: [],
			};

		case actions.RESET_BLOCKTANK_STORE:
			return defaultBlocktankShape;

		default:
			return state;
	}
};

export default blocktank;
