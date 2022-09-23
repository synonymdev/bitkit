import {
	IGetInfoResponse,
	IGetOrderResponse,
	IService,
} from '@synonymdev/blocktank-client';

export interface IBlocktank {
	serviceList: IService[];
	serviceListLastUpdated?: number;
	orders: IGetOrderResponse[];
	info: IGetInfoResponse;
}
