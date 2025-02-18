import { facts } from '../../constants/widgets';
import { TWidgetId, TWidgetOptions } from '../../store/types/widgets';

export const getDefaultOptions = (id: TWidgetId): TWidgetOptions => {
	switch (id) {
		case 'blocks':
			return {
				height: true,
				time: true,
				date: true,
				transactionCount: false,
				size: false,
				weight: false,
				difficulty: false,
				hash: false,
				merkleRoot: false,
				showSource: false,
			};
		case 'facts':
			return { showSource: false };
		case 'news':
			return {
				showDate: true,
				showTitle: true,
				showSource: true,
			};
		case 'price':
			return {
				pairs: ['BTC/USD'],
				period: '1D',
				showSource: false,
			};
		case 'weather':
			return {
				showStatus: true,
				showText: true,
				showMedian: true,
				showNextBlockFee: true,
			};
		default:
			return {};
	}
};

export const getRandomFact = (): string => {
	const randomIndex = Math.floor(Math.random() * facts.length);
	return facts[randomIndex];
};
