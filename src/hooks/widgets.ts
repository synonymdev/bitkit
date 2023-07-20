import { useEffect, useState } from 'react';
import { SlashURL, Hyperdrive } from '@synonymdev/slashtags-sdk';

import { useSlashtagsSDK } from '../components/SlashtagsProvider';
import i18n from '../utils/i18n';
import { showToast } from '../utils/notifications';
import { decodeWidgetFieldValue } from '../utils/widgets';
import { decodeJSON, readAsDataURL } from '../utils/slashtags';
import { SlashFeedJSON } from '../store/types/widgets';

type Field = {
	name: string;
	value: string;
	unit?: string;
};

export const useSlashfeed = (options: {
	url: string;
	fields?: SlashFeedJSON['fields'];
}): {
	config?: SlashFeedJSON;
	icon?: string;
	fields: Field[];
	drive?: Hyperdrive;
	loading: boolean;
	failed: boolean;
} => {
	const [config, setConfig] = useState<SlashFeedJSON>();
	const [icon, setIcon] = useState<string>();
	const [fields, setFields] = useState<Field[]>([]);
	const [_drive, setDrive] = useState<Hyperdrive>();
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);

	const sdk = useSlashtagsSDK();

	useEffect(() => {
		let unmounted = false;

		setLoading(true);

		const parsed = SlashURL.parse(options.url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		const getData = async (): Promise<void> => {
			try {
				const slashfeed = await drive.get('/slashfeed.json');
				const _config = decodeJSON(slashfeed) as SlashFeedJSON;

				if (!_config) {
					setFailed(true);
					setLoading(false);
					return;
				}

				let feedIcon = _config.icons['48'] || Object.values(_config.icons)[0];
				if (feedIcon.startsWith('/')) {
					feedIcon = await readAsDataURL(drive, feedIcon);
				}

				setConfig(_config);
				setIcon(feedIcon);

				const read = async (): Promise<void> => {
					const _fields = options.fields ?? _config.fields;

					// Don't continue for news & facts feeds
					if (!_fields.length || _fields[0].main === '/feed/') {
						setLoading(false);
						return;
					}

					const promises = _fields.map(async (field) => {
						const buffer: Uint8Array = await drive.get(field.main);
						const value = decodeWidgetFieldValue(_config.type, field, buffer);
						return { name: field.name, value };
					});

					const values = await Promise.all(promises);

					if (!unmounted) {
						setFields(values);
						setLoading(false);
					}
				};

				try {
					await drive.ready();
					setDrive(drive);
					read();
					drive.core.on('append', read);
				} catch (error) {
					console.error(error);
					setLoading(false);
					setFailed(true);
					showToast({
						type: 'error',
						title: i18n.t('widget_error_drive'),
						description: error.message,
					});
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
			drive.core.removeAllListeners();
		};
	}, [sdk, options.url, options.fields]);

	return {
		config,
		icon,
		fields,
		drive: _drive,
		loading,
		failed,
	};
};
