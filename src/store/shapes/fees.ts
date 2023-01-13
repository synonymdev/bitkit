import { EFeeId, IFees } from '../types/fees';

export type TFeeText = {
	title: string;
	description: string;
	shortRange: string;
	shortDescription: string;
};

type TFeeTexts = {
	[key in EFeeId]: TFeeText;
};

export const FeeText: TFeeTexts = {
	[EFeeId.instant]: {
		title: 'Instant',
		description: '±2-10 seconds',
		shortRange: '2-10s',
		shortDescription: '±2s',
	},
	[EFeeId.fast]: {
		title: 'Fast',
		description: '±10-20 minutes',
		shortRange: '10-20m',
		shortDescription: '±10m',
	},
	[EFeeId.normal]: {
		title: 'Normal',
		description: '±20-60 minutes',
		shortRange: '20-60m',
		shortDescription: '±20m',
	},
	[EFeeId.slow]: {
		title: 'Slow',
		description: '±1-2 hours',
		shortRange: '1-2h',
		shortDescription: '±1h',
	},
	[EFeeId.minimum]: {
		title: 'Minimum',
		description: '+2 hours',
		shortRange: '+2h',
		shortDescription: '+2h',
	},
	[EFeeId.custom]: {
		title: 'Custom',
		description: 'Depends on the fee',
		shortRange: 'Depends on the fee',
		shortDescription: 'Depends on the fee',
	},
	[EFeeId.none]: {
		title: '',
		description: '',
		shortRange: '',
		shortDescription: '',
	},
};

export const defaultFeesShape: IFees = {
	//On-chain fees in sats/vbyte
	onchain: {
		fast: 4, // 10-20 mins
		normal: 3, // 20-60 mins
		slow: 2, // 1-2 hrs
		minimum: 1,
		timestamp: Date.now() - 60 * 30 * 1000 - 1,
	},
};
