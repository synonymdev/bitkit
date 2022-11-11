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
		files: Array<{ [key: string]: string }>;
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
	widgets: { [url: string]: IWidget };
	onboardedWidgets: boolean;
}
