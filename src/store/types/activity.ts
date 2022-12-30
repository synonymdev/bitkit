import { EPaymentType } from './wallet';

export enum EActivityType {
	onchain = 'onchain',
	lightning = 'lightning',
	tether = 'tether',
	// TODO: add all other activity types as we support them
}

export type IActivityItem =
	| TOnchainActivityItem
	| TLightningActivityItem
	| TTetherActivityItem;

export type TOnchainActivityItem = {
	id: string;
	activityType: EActivityType.onchain;
	txType: EPaymentType;
	txId: string;
	value: number;
	fee: number;
	feeRate: number;
	address: string;
	confirmed: boolean;
	timestamp: number;
	isBoosted: boolean;
	isTransfer: boolean;
};

export type TLightningActivityItem = {
	id: string;
	activityType: EActivityType.lightning;
	txType: EPaymentType;
	txId: string;
	value: number;
	address: string;
	message: string;
	timestamp: number;
};

export type TTetherActivityItem = {
	id: string;
	activityType: EActivityType.tether;
	txType: EPaymentType;
	txId: string;
	value: number;
	timestamp: number;
};

export type IActivityItemFormatted = IActivityItem & {
	formattedDate: string;
};

export type TOnchainActivityItemFormatted = TOnchainActivityItem & {
	formattedDate: string;
};

export type TLightningActivityItemFormatted = TLightningActivityItem & {
	formattedDate: string;
};

export interface IActivity {
	items: IActivityItem[];
}
