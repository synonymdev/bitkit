import { IOnchainFees } from 'beignet';

export enum EFeeId {
	instant = 'instant',
	fast = 'fast',
	normal = 'normal',
	slow = 'slow',
	minimum = 'minimum',
	custom = 'custom',
	none = 'none',
}

export interface IFees {
	onchain: IOnchainFees;
	override: boolean;
}
