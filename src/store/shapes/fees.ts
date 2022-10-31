import { IFees } from '../types/fees';

export const FeeText = {
	instant: {
		title: 'Instant',
		description: '2-10 seconds',
	},
	fast: {
		title: 'Fast',
		description: '10-20 minutes',
	},
	normal: {
		title: 'Normal',
		description: '20-60 minutes',
	},
	slow: {
		title: 'Slow',
		description: '1-2 hours',
	},
	custom: {
		title: 'Custom',
		description: 'Depends on the fee',
	},
	none: {
		title: '',
		description: '',
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
