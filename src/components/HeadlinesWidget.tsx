import React, { memo, ReactElement, useEffect, useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { SlashURL } from '@synonymdev/slashtags-sdk';

import {
	View,
	Text01M,
	Caption13M,
	NewspaperIcon,
	Text02S,
	GearIcon,
} from '../styles/components';
import { IWidget } from '../store/types/widgets';
import { useSlashtagsSDK } from './SlashtagsProvider';
import { showErrorNotification } from '../utils/notifications';
import { decodeJSON } from '../utils/slashtags';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { navigate } from '../navigation/root/RootNavigator';
import Button from './Button';

const HeadlinesWidget = ({
	url,
	widget,
}: {
	url: string;
	widget: IWidget;
}): ReactElement => {
	const [showButtons, setShowButtons] = useState(false);
	const [article, setArticle] = useState<{
		title: string;
		link: string;
		publisher: { title: string };
	}>();

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
				read();
				drive.core.on('append', read);
			})
			.catch((e: Error) => {
				showErrorNotification({
					title: 'Failed to open news feed drive',
					message: e.message,
				});
			});

		function read(): void {
			// Manually find latest file as efficently as possible
			const stream = drive.entries({
				gt: '/feed/',
				lte: '/feed0',
				reverse: true,
				limit: 1,
			});

			stream.on('data', async (data: any) => {
				const _article = await drive.get(data.key).then(decodeJSON).catch(noop);

				!unmounted && _article && setArticle(_article);
			});
		}

		return function cleanup() {
			unmounted = true;
		};
	}, [sdk, url]);

	const switchShowButtons = (): void => {
		setShowButtons((b) => !b);
	};

	return (
		<View>
			<TouchableOpacity
				style={styles.root}
				onPress={switchShowButtons}
				activeOpacity={0.9}>
				<View style={styles.icon}>
					{<NewspaperIcon width={32} height={32} />}
				</View>
				<View style={styles.infoContainer}>
					<Text01M style={styles.name} numberOfLines={1}>
						{article?.title || widget.feed.name}
					</Text01M>
					<View style={styles.row}>
						<View style={styles.linkContainer}>
							<TouchableOpacity
								activeOpacity={0.9}
								onPress={(): void => {
									article?.link && Linking.openURL(article.link);
								}}>
								<Caption13M color="gray1" numberOfLines={1}>
									{article?.link}
								</Caption13M>
							</TouchableOpacity>
						</View>
						<View style={styles.authorContainer}>
							<Text02S style={styles.author} numberOfLines={1}>
								{article?.publisher.title}
							</Text02S>
						</View>
					</View>
				</View>
			</TouchableOpacity>
			{showButtons && (
				<View style={styles.button}>
					<Button
						text=""
						icon={<GearIcon width={20} />}
						onPress={(): void => navigate('WidgetFeedEdit', { url })}
					/>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	icon: {
		marginRight: 8,
		borderRadius: 6.4,
		overflow: 'hidden',
		height: 32,
		width: 32,
	},
	infoContainer: {
		flex: 1.2,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		flexDirection: 'row',
	},
	name: {
		lineHeight: 22,
	},
	linkContainer: {
		flex: 3,
	},
	authorContainer: {
		flex: 2,
	},
	author: {
		textAlign: 'right',
	},
	button: {
		position: 'absolute',
		paddingLeft: 8,
		right: 0,
		top: 0,
		bottom: 1,
		display: 'flex',
		justifyContent: 'center',
	},
});

export default memo(HeadlinesWidget);

function noop(): void {}
