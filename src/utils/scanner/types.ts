import { EAvailableNetwork } from '../networks';
import {
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLWithdrawParams,
} from 'js-lnurl';

export enum EQRDataType {
	unified = 'unified',
	onchain = 'onchain',
	lightning = 'lightning',
	lnurlPay = 'lnurlPay',
	lnurlChannel = 'lnurlChannel',
	lnurlAuth = 'lnurlAuth',
	lnurlWithdraw = 'lnurlWithdraw',
	lnurlAddress = 'lnurlAddress',
	orangeTicket = 'orangeTicket',
	slashAuth = 'slashAuth',
	slashtag = 'slashURL',
	slashFeed = 'slashFeed',
	nodeId = 'nodeId',
	treasureHunt = 'treasureHunt',
	pubkyAuth = 'pubkyAuth',
}

export type TLnUrlData =
	| TLnUrlAuth
	| TLnUrlChannel
	| TLnUrlPay
	| TLnUrlWithdraw
	| TLnUrlAddress;

export type QRData =
	| TUnified
	| TBitcoinData
	| TLightningData
	| TLnUrlData
	| TOrangeTicket
	| TNodeId
	| TSlashTagUrl
	| TSlashAuthUrl
	| TSlashFeedUrl
	| TTreasureChestUrl
	| TPubkyAuthUrl;

export type TPaymentUri = TUnified | TBitcoinData | TLightningData;

export type TUnified = {
	type: EQRDataType.unified;
	preferredPaymentMethod?: EQRDataType.onchain | EQRDataType.lightning;
} & Omit<TBitcoinData, 'type'> &
	Omit<TLightningData, 'type'>;

export type TBitcoinData = {
	type: EQRDataType.onchain;
	address: string;
	amount: number;
	network?: EAvailableNetwork;
	message?: string;
	slashTagsUrl?: string;
};

export type TLightningData = {
	type: EQRDataType.lightning;
	lightningInvoice: string;
	amount: number;
	isExpired: boolean;
	message?: string;
	slashTagsUrl?: string;
};

export type TLnUrlAuth = {
	type: EQRDataType.lnurlAuth;
	lnUrlParams: LNURLAuthParams;
};

export type TLnUrlChannel = {
	type: EQRDataType.lnurlChannel;
	lnUrlParams: LNURLChannelParams;
};

export type TLnUrlPay = {
	type: EQRDataType.lnurlPay;
	lnUrlParams: LNURLPayParams;
};

export type TLnUrlWithdraw = {
	type: EQRDataType.lnurlWithdraw;
	lnUrlParams: LNURLWithdrawParams;
};

export type TLnUrlAddress = {
	type: EQRDataType.lnurlAddress;
	address: string;
	lnUrlParams: LNURLPayParams;
};

export type TOrangeTicket = {
	type: EQRDataType.orangeTicket;
	ticketId: string;
};

export type TNodeId = {
	type: EQRDataType.nodeId;
	uri: string;
};

export type TSlashTagUrl = {
	type: EQRDataType.slashtag;
	url: string;
};

export type TSlashAuthUrl = {
	type: EQRDataType.slashAuth;
	url: string;
};

export type TSlashFeedUrl = {
	type: EQRDataType.slashFeed;
	url: string;
};

export type TTreasureChestUrl = {
	type: EQRDataType.treasureHunt;
	chestId: string;
};

export type TPubkyAuthUrl = {
	type: EQRDataType.pubkyAuth;
	url: string;
};

export const paymentTypes = [
	EQRDataType.unified,
	EQRDataType.onchain,
	EQRDataType.lightning,
	EQRDataType.lnurlPay,
	EQRDataType.lnurlAddress,
];
