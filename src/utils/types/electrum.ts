import { EAvailableNetwork } from '../networks';

export interface IHeader {
	height: number;
	hash: string;
	hex: string;
}

export interface IGetHeaderResponse {
	id: number;
	error: boolean;
	method: 'getHeader';
	data: string;
	network: EAvailableNetwork;
}

export type TGetAddressHistory = { txid: string; height: number };
