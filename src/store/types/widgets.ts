// TODO(slashtags): move somewhere else? slashtags-feeds?
export interface SlashFeedJSON {
	name: string;
	type: string;
	description: string;
	icons: {
		[size: string]: string;
	};
	fields: Array<{
		name: string;
		main: string;
		files: {
			[key: string]: string;
		};
		[key: string]: any;
	}>;
	[key: string]: any;
}

export type TGraphPeriod = '1D' | '1W' | '1M';

export type TFeedWidgetOptions = {
	fields: string[];
	extras?: {
		period?: TGraphPeriod;
		showSource?: boolean;
		showTitle?: boolean;
	};
};

export type TFeedWidget = {
	url: string;
	type: string;
	fields: SlashFeedJSON['fields'];
	extras?: TFeedWidgetOptions['extras'];
};

export type TWeatherWidgetOptions = {
	showStatus: boolean;
	showText: boolean;
	showMedian: boolean;
	showNextBlockFee: boolean;
};

export type TWidgetOptions = TWeatherWidgetOptions;

export type TWidget = TFeedWidget | TWidgetOptions;

export type TWidgets = {
	[id: string]: TWidget | undefined;
};
