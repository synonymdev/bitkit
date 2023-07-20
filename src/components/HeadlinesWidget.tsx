import React, { memo, ReactElement, useEffect, useState } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import { useTranslation } from 'react-i18next';

import { Caption13M, Title } from '../styles/text';
import { useSlashtagsSDK } from './SlashtagsProvider';
import { openURL } from '../utils/helpers';
import { decodeJSON } from '../utils/slashtags';
import { showToast } from '../utils/notifications';
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
	const sdk = useSlashtagsSDK();
	const { t } = useTranslation('slashtags');
	const [article, setArticle] = useState<Article>();
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
				// Manually find latest file as efficently as possible
				const stream = drive.entries({
					gt: '/feed/',
					lte: '/feed0',
					reverse: true,
					limit: 1,
				});

				stream.on('data', async (data: any) => {
					try {
						const buffer = await drive.get(data.key);
						const _article = decodeJSON(buffer) as Article;

						if (!unmounted && _article) {
							setArticle(_article);
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
			name={t('widget_headlines')}
			isLoading={isLoading}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
			onPress={(): void => {
				if (!isEditing && article?.link) {
					openURL(article.link);
				}
			}}>
			<>
				<Title numberOfLines={2}>{article?.title}</Title>

				<TouchableOpacity
					style={styles.source}
					activeOpacity={0.9}
					onPress={(): void => {
						if (article?.comments) {
							openURL(article.comments);
						} else {
							openURL(article!.link);
						}
					}}>
					<View style={styles.columnLeft}>
						<Caption13M color="gray1" numberOfLines={1}>
							{t('widget_source')}
						</Caption13M>
					</View>
					<View style={styles.columnRight}>
						<Caption13M color="gray1" numberOfLines={1}>
							{article?.publisher.title}
						</Caption13M>
					</View>
				</TouchableOpacity>
			</>
		</BaseFeedWidget>
	);
};

const styles = StyleSheet.create({
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
		// increase hitbox
		paddingBottom: 10,
		marginBottom: -10,
		paddingLeft: 10,
		marginLeft: -10,
		paddingRight: 10,
		marginRight: -10,
	},
});

export default memo(HeadlinesWidget);
