import React, { memo, ReactElement, useEffect, useState } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Reader from '@synonymdev/slashtags-widget-news-feed/lib/reader';

import { BodyM, CaptionB, Title } from '../styles/text';
import { openAppURL, timeAgo } from '../utils/helpers';
import { showToast } from '../utils/notifications';
import { useSlashtags2 } from '../hooks/slashtags2';
import BaseFeedWidget from './BaseFeedWidget';

type Article = {
	title: string;
	published: string;
	publishedDate: string;
	link: string;
	comments?: string;
	author?: string;
	categories?: string[];
	thumbnail?: string;
	publisher: {
		title: string;
		link: string;
		image?: string;
	};
};

const HeadlinesWidget = ({
	url,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	url: string;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [article, setArticle] = useState<Article>();
	const [isLoading, setIsLoading] = useState(false);
	const { webRelayClient, webRelayUrl } = useSlashtags2();

	useEffect(() => {
		let unmounted = false;

		setIsLoading(true);

		const getData = async (): Promise<void> => {
			try {
				const reader = new Reader(
					webRelayClient,
					`${url}?relay=${webRelayUrl}`,
				);

				const allArticles = await reader.getAllArticles();
				const _article = allArticles
					.sort((a, b) => b.published - a.published)
					.slice(0, 10)[Math.floor(Math.random() * 10)];

				if (!unmounted && _article) {
					setArticle(_article);
					setIsLoading(false);
				}
			} catch (error) {
				console.error(error);
				setIsLoading(false);
				showToast({
					type: 'warning',
					title: t('widget_error_drive'),
					description: `An error occurred: ${error.message}`,
				});
			}
		};

		getData();

		return () => {
			unmounted = true;
		};
	}, [url, t, webRelayClient, webRelayUrl]);

	const link = article?.comments || article?.link;

	return (
		<BaseFeedWidget
			style={style}
			url={url}
			name={t('widget_headlines')}
			isLoading={isLoading}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
			onPress={(): void => {
				if (!isEditing && link) {
					openAppURL(link);
				}
			}}>
			<>
				{article?.publishedDate && (
					<BodyM style={styles.date} numberOfLines={1}>
						{timeAgo(article.publishedDate)}
					</BodyM>
				)}

				<Title numberOfLines={2}>{article?.title}</Title>

				<TouchableOpacity
					style={styles.source}
					activeOpacity={0.9}
					hitSlop={{ right: 15, bottom: 15, left: 15 }}
					onPress={(): void => {
						if (link) openAppURL(link);
					}}>
					<View style={styles.columnLeft}>
						<CaptionB color="white50" numberOfLines={1}>
							{t('widget_source')}
						</CaptionB>
					</View>
					<View style={styles.columnRight}>
						<CaptionB color="white50" numberOfLines={1}>
							{article?.publisher.title}
						</CaptionB>
					</View>
				</TouchableOpacity>
			</>
		</BaseFeedWidget>
	);
};

const styles = StyleSheet.create({
	date: {
		marginBottom: 16,
	},
	columnLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	source: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
});

export default memo(HeadlinesWidget);
