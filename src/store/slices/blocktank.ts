import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
	IBtInfo,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';
import { initialBlocktankState } from '../shapes/blocktank';
import { IBlocktank } from '../types/blocktank';

export const blocktankSlice = createSlice({
	name: 'blocktank',
	initialState: initialBlocktankState,
	reducers: {
		updateBlocktank: (state, action: PayloadAction<Partial<IBlocktank>>) => {
			state = Object.assign(state, action.payload);
		},
		updateBlocktankInfo: (state, action: PayloadAction<IBtInfo>) => {
			state.info = action.payload;
		},
		updateBlocktankOrder: (state, action: PayloadAction<IBtOrder>) => {
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

				state.orders = updatedOrders;
			} else {
				state.orders = [...state.orders, action.payload];
			}
		},
		addPaidBlocktankOrder: (
			state,
			action: PayloadAction<{ orderId: string; txId: string }>,
		) => {
			state.paidOrders[action.payload.orderId] = action.payload.txId;
		},
		addCjitEntry: (state, action: PayloadAction<ICJitEntry>) => {
			state.cJitEntries.push(action.payload);
		},
		updateCjitEntry: (state, action: PayloadAction<ICJitEntry>) => {
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

				state.cJitEntries = updatedEntries;
			} else {
				state.cJitEntries = [...state.cJitEntries, action.payload];
			}
		},
		resetBlocktankOrders: (state) => {
			state.orders = [];
		},
		resetBlocktankState: () => initialBlocktankState,
	},
});

const { actions, reducer } = blocktankSlice;

export const {
	updateBlocktank,
	updateBlocktankInfo,
	updateBlocktankOrder,
	addPaidBlocktankOrder,
	addCjitEntry,
	updateCjitEntry,
	resetBlocktankOrders,
	resetBlocktankState,
} = actions;

export default reducer;
