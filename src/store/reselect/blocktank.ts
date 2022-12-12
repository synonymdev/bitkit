import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IGetOrderResponse, IService } from '@synonymdev/blocktank-client';
import { IBlocktank, TPaidBlocktankOrders } from '../types/blocktank';

const blocktankState = (state: Store): IBlocktank => state.blocktank;

export const blocktankServiceListSelector = createSelector(
	blocktankState,
	(blocktank): IService[] => blocktank.serviceList,
);
export const blocktankOrdersSelector = createSelector(
	blocktankState,
	(blocktank): IGetOrderResponse[] => blocktank.orders ?? [],
);
export const blocktankPaidOrdersSelector = createSelector(
	blocktankState,
	(blocktank): TPaidBlocktankOrders => blocktank.paidOrders,
);
