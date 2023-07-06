import { SlashURL, Hyperdrive } from '@synonymdev/slashtags-sdk';
import { useEffect, useState } from 'react';

import { useSlashtagsSDK } from '../components/SlashtagsProvider';
import { showToast } from '../utils/notifications';
import { decodeWidgetFieldValue } from '../utils/widgets';
import { IWidget } from '../store/types/widgets';

export const useFeedWidget = ({
	url,
	feed,
}: {
	url: string;
	feed: IWidget['feed'];
}): {
	value?: any;
	drive?: Hyperdrive;
} => {
	const [value, setValue] = useState<string>();
	const [_drive, setDrive] = useState<Hyperdrive>();

	const sdk = useSlashtagsSDK();

	useEffect(() => {
		let unmounted = false;

		const parsed = SlashURL.parse(url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		drive
			.ready()
			.then(() => {
				setDrive(drive);
				read();
				drive.core.on('append', read);
			})
			.catch((e: Error) => {
				showToast({
					type: 'error',
					title: 'Failed to open feed drive',
					description: e.message,
				});
			});

		function read(): void {
			if (!feed?.field) {
				return;
			}
			drive
				.get(feed.field.main)
				.then((buf: Uint8Array) =>
					decodeWidgetFieldValue(feed.type, feed.field, buf),
				)
				.then((_value: any) => !unmounted && _value && setValue(_value));
		}

		return function cleanup() {
			unmounted = true;
			drive.core.removeAllListeners();
		};
	}, [url, sdk, feed]);

	return {
		value,
		drive: _drive,
	};
};
