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
	confirmTimestamp?: number;
	exists: boolean; // Used to determine if the transaction exists on the blockchain or if it was reorg'd/bumped from the mempool.
};

export type TLightningActivityItem = {
	id: string;
	activityType: EActivityType.lightning;
	txType: EPaymentType;
	value: number;
	fee?: number;
	address: string;
	confirmed: boolean;
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

export interface IActivity {
	items: IActivityItem[];
}
