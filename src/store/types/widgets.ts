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

export type TWidgetSettings = {
	fields: string[];
	extras?: {
		period?: TGraphPeriod;
		showSource?: boolean;
	};
};

export interface IWidget {
	type: string;
	fields: SlashFeedJSON['fields'];
	extras?: TWidgetSettings['extras'];
	magiclink?: boolean;
}

export interface IWidgets {
	[url: string]: IWidget | undefined;
}

export interface IWidgetsStore {
	widgets: IWidgets;
	onboardedWidgets: boolean;
	sortOrder: string[];
}
