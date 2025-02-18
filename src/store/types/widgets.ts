import { widgets } from '../../constants/widgets';

export type TWidgetId = keyof typeof widgets;

export type TGraphPeriod = '1D' | '1W' | '1M' | '1Y';

export type TBlocksWidgetOptions = {
	height: boolean;
	time: boolean;
	date: boolean;
	transactionCount: boolean;
	size: boolean;
	weight: boolean;
	difficulty: boolean;
	hash: boolean;
	merkleRoot: boolean;
	showSource: boolean;
};

export type TFactsWidgetOptions = {
	showSource: boolean;
};

export type TNewsWidgetOptions = {
	showDate: boolean;
	showTitle: boolean;
	showSource: boolean;
};

export type TPriceWidgetOptions = {
	pairs: string[];
	period: TGraphPeriod;
	showSource: boolean;
};

export type TWeatherWidgetOptions = {
	showStatus: boolean;
	showText: boolean;
	showMedian: boolean;
	showNextBlockFee: boolean;
};

export type TWidgetOptions =
	| TBlocksWidgetOptions
	| TFactsWidgetOptions
	| TNewsWidgetOptions
	| TPriceWidgetOptions
	| TWeatherWidgetOptions
	| Record<string, never>;

export type TWidgets = {
	[id: string]: TWidgetOptions | undefined;
};
