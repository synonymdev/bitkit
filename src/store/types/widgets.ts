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

export interface IWidget {
	feed: Pick<SlashFeedJSON, 'name' | 'type'> & {
		icon: string;
		field: SlashFeedJSON['fields'][0];
	};
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
