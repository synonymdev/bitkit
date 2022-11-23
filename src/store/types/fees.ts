export enum EFeeIds {
	instant = 'instant',
	fast = 'fast',
	normal = 'normal',
	slow = 'slow',
	minimum = 'minimum',
	custom = 'custom',
	none = 'none',
}

//On-chain fee estimates in sats/vbyte
export interface IOnchainFees {
	fast: number; // 10-20 mins
	normal: number; // 20-60 mins
	slow: number; // 1-2 hrs
	minimum: number;
	timestamp: number;
}

export interface IFees {
	onchain: IOnchainFees;
}
