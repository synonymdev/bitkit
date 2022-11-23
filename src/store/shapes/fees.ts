import { EFeeIds, IFees } from '../types/fees';

export type TFeeText = {
	title: string;
	description: string;
	shortDescription: string;
};

type TFeeTexts = {
	[key in EFeeIds]: TFeeText;
};

export const FeeText: TFeeTexts = {
	instant: {
		title: 'Instant',
		description: '±2-10 seconds',
		shortDescription: '±2s',
	},
	fast: {
		title: 'Fast',
		description: '±10-20 minutes',
		shortDescription: '±10m',
	},
	normal: {
		title: 'Normal',
		description: '±20-60 minutes',
		shortDescription: '±20m',
	},
	slow: {
		title: 'Slow',
		description: '±1-2 hours',
		shortDescription: '±1h',
	},
	minimum: {
		title: 'Minimum',
		description: '+2 hours',
		shortDescription: '+2h',
	},
	custom: {
		title: 'Custom',
		description: 'Depends on the fee',
		shortDescription: 'Depends on the fee',
	},
	none: {
		title: '',
		description: '',
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
