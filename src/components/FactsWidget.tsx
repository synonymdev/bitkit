import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import b4a from 'b4a';

import { Title } from '../styles/text';
import { showToast } from '../utils/notifications';
import { useSlashtagsSDK } from './SlashtagsProvider';
import BaseFeedWidget from './BaseFeedWidget';

type TFactFile = {
	key: string;
	seq: number;
	value: {
		blob: {
			blockLength: number;
			blockOffset: number;
			byteLength: number;
			byteOffset: number;
		};
		executable: boolean;
		linkname: string;
		metadata: any;
	};
};

const FactsWidget = ({
	url,
	isEditing = false,
	style,
	testID,
	onPressIn,
	onLongPress,
}: {
	url: string;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const sdk = useSlashtagsSDK();
	const { t } = useTranslation('slashtags');
	const [fact, setFact] = useState<string>();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let unmounted = false;

		setIsLoading(true);

		const parsed = SlashURL.parse(url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		const getData = async (): Promise<void> => {
			const read = (): void => {
				const stream = drive.list('/feed');
				const files: TFactFile[] = [];

				stream.on('data', (data: TFactFile) => {
					files.push(data);
				});

				stream.on('end', async () => {
					const randomFact = files[Math.floor(Math.random() * files.length)];
					const { blob } = randomFact.value;

					try {
						const buffer: Uint8Array = await drive.blobs.get(blob);
						const _fact = b4a.toString(buffer);

						if (!unmounted && _fact) {
							setFact(_fact);
							setIsLoading(false);
						}
					} catch (error) {
						console.log(error);
						setIsLoading(false);
					}
				});
			};

			try {
				await drive.ready();
				read();
				drive.core.on('append', read);
			} catch (error) {
				console.error(error);
				setIsLoading(false);
				showToast({
					type: 'error',
					title: t('widget_error_drive'),
					description: error.message,
				});
			}
		};

		getData();

		return () => {
			unmounted = true;
		};
	}, [sdk, url, t]);

	return (
		<BaseFeedWidget
			style={style}
			url={url}
			name={t('widget_facts')}
			isLoading={isLoading}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<Title numberOfLines={2}>{fact}</Title>
		</BaseFeedWidget>
	);
};

export default memo(FactsWidget);
