import { useEffect, useMemo, useState } from 'react';
import { Reader } from '@synonymdev/feeds';
import b4a from 'b4a';

import { SlashFeedJSON } from '../store/types/widgets';
import { SUPPORTED_FEED_TYPES, decodeWidgetFieldValue } from '../utils/widgets';
import { useSlashtags } from './slashtags';

type Field = {
	name: string;
	value: string;
	unit?: string;
};

type Cache = {
	[url: string]: {
		config: SlashFeedJSON;
		icon: string;
	};
};

// Cache widget data to reduce layout shifts while loading.
const cache: Cache = {};

export const useSlashfeed = (options: {
	url: string;
	fields?: SlashFeedJSON['fields'];
}): {
	reader: Reader;
	fields: Field[];
	config?: SlashFeedJSON;
	icon?: string;
	loading: boolean;
	failed: boolean;
} => {
	const { webRelayClient, webRelayUrl } = useSlashtags();
	const [config, setConfig] = useState<SlashFeedJSON>(
		cache[options.url]?.config,
	);
	const [icon, setIcon] = useState<string>(cache[options.url]?.icon);
	const [fields, setFields] = useState<Field[]>([]);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	const reader = useMemo(() => {
		return new Reader(webRelayClient, `${options.url}?relay=${webRelayUrl}`);
	}, [options.url, webRelayUrl, webRelayClient]);

	useEffect(() => {
		let unmounted = false;

		const getData = async (): Promise<void> => {
			try {
				await reader.ready();

				if (!reader.config) {
					setFailed(true);
					setLoading(false);
					return;
				}

				if (!cache[options.url]) {
					setLoading(true);
				}

				cache[options.url] = cache[options.url] || {};
				cache[options.url].config = reader.config as SlashFeedJSON;

				setConfig(reader.config as SlashFeedJSON);

				if (reader.icon) {
					// Assume it is an svg icon
					setIcon(b4a.toString(reader.icon));
				} else if (reader.config.icons?.base64) {
					const iconField = reader.config.icons?.base64;
					const fieldName = iconField.replace('/feed/', '');
					const base64 = await reader.getField(fieldName);
					// TODO: remove after PR is merged
					// https://github.com/synonymdev/slashtags-widget-event-feed/pull/2
					const dataUrl = `data:image/png;base64,${base64}`;
					cache[options.url].icon = dataUrl;
					// Assume it is a png icon
					setIcon(dataUrl);
				}

				const _fields = options.fields ?? reader.config.fields ?? [];

				// Don't continue for news & facts feeds
				if (
					reader.config.type === SUPPORTED_FEED_TYPES.FACTS_FEED ||
					reader.config.type === SUPPORTED_FEED_TYPES.HEADLINES_FEED ||
					reader.config.type === SUPPORTED_FEED_TYPES.LUGANO_FEED
				) {
					setLoading(false);
					return;
				}

				const promises = _fields.map(async (field: { name: string }) => {
					const value = await reader.getField(field.name);
					const formattedValue = decodeWidgetFieldValue(
						reader.config.type ?? '',
						field,
						value,
					);
					return {
						name: field.name as string,
						value: formattedValue as string,
					};
				});

				const values = await Promise.all(promises);

				if (!unmounted) {
					setFields(values);
					setLoading(false);
				}
			} catch (error) {
				console.error(error);
				setLoading(false);
				setFailed(true);
			}
		};

		getData();

		return (): void => {
			unmounted = true;
		};
	}, [reader, options.url, options.fields]);

	return {
		reader,
		config,
		icon,
		fields,
		loading,
		failed,
	};
};
