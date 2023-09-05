import { useEffect, useMemo, useState } from 'react';
import { Reader } from '@synonymdev/slashtags-feeds';
import b4a from 'b4a';

import { webRelayClient, webRelayUrl } from '../components/SlashtagsProvider2';
import { SlashFeedJSON } from '../store/types/widgets';
import { SUPPORTED_FEED_TYPES, decodeWidgetFieldValue } from '../utils/widgets';

type Field = {
	name: string;
	value: string;
	unit?: string;
};

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
	const [config, setConfig] = useState<any>();
	const [icon, setIcon] = useState<string>();
	const [fields, setFields] = useState<Field[]>([]);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	const reader = useMemo(() => {
		return new Reader(webRelayClient, `${options.url}?relay=${webRelayUrl}`);
	}, [options.url]);

	useEffect(() => {
		let unmounted = false;

		setLoading(true);

		const getData = async (): Promise<void> => {
			try {
				const _config = await reader.getConfig();

				if (!_config) {
					setFailed(true);
					setLoading(false);
					return;
				}

				setConfig(_config);

				const buffer = await reader.getIcon();
				const _icon = b4a.toString(buffer);
				setIcon(_icon);

				const _fields = options.fields ?? _config.fields ?? [];

				// Don't continue for news & facts feeds
				if (
					_config.type === SUPPORTED_FEED_TYPES.FACTS_FEED ||
					_config.type === SUPPORTED_FEED_TYPES.HEADLINES_FEED
				) {
					setLoading(false);
					return;
				}

				const promises = _fields.map(async (field) => {
					const fieldName = field.main.replace('/feed/', '');
					const value = await reader.getField(fieldName);
					const formattedValue = decodeWidgetFieldValue(
						_config.type ?? '',
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

		return () => {
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
