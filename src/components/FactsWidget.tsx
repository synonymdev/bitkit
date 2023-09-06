import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Reader } from '@synonymdev/slashtags-widget-facts-feed';

import { Title } from '../styles/text';
import { showToast } from '../utils/notifications';
import { webRelayClient, webRelayUrl } from './SlashtagsProvider2';
import BaseFeedWidget from './BaseFeedWidget';

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
	const { t } = useTranslation('slashtags');
	const [fact, setFact] = useState<string>();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setIsLoading(true);

		const getData = async (): Promise<void> => {
			try {
				const reader = new Reader(
					webRelayClient,
					`${url}?relay=${webRelayUrl}`,
				);
				const result = await reader.getRandomFact();
				setFact(result);
				setIsLoading(false);
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
	}, [url, t]);

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
