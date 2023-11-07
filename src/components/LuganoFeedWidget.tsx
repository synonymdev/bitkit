import React, { memo, ReactElement, useEffect, useState } from 'react';
import {
	View,
	StyleSheet,
	StyleProp,
	ViewStyle,
	Image,
	TouchableOpacity,
} from 'react-native';

import { Caption13M, Text01M, Text02M } from '../styles/text';
import BaseFeedWidget from './BaseFeedWidget';
import { openURL } from '../utils/helpers';

import { useSlashfeed } from '../hooks/widgets';
import Button from './Button';
import { CalendarIcon, MapPinLineIcon, MapTrifoldIcon } from '../styles/icons';
import { useAppSelector } from '../hooks/redux';

const cache = {
	banner: '',
	schedule: [],
	links: [],
};

const LuganoWidget = ({
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
	const { config, reader } = useSlashfeed({ url });
	const { treasureChests } = useAppSelector((state) => state.settings);
	const [banner, setBanner] = useState(cache.banner);
	const [links, setLinks] = useState<{ name: string; url: string }[]>(
		cache.links,
	);
	const [schedule, setSchedule] = useState<
		{ time: string; location: string; name: string }[]
	>([]);

	const numberOfChests = treasureChests.filter((c) => !c.isAirdrop).length;

	useEffect(() => {
		const bannerBase64Path = config?.fields?.find((f) => f.name === 'banner')
			?.files?.base64;
		if (bannerBase64Path) {
			reader
				.getField(bannerBase64Path.replace('/feed/', ''))
				.then((base64) => {
					if (!base64) {
						return;
					}
					const dataURL = `data:image/png;base64,${base64 as string}`;
					setBanner(dataURL);
					cache.banner = dataURL;
				})
				.catch((error) => {
					console.log('Error while reading banner png', error);
				});
		}

		reader
			.getField('links.json')
			// @ts-ignore
			.then((_links: { name: string; url: string }[]) => {
				if (!_links || !Array.isArray(_links)) {
					return;
				}
				// @ts-ignore
				cache.links = _links;
				setLinks(_links);
			})
			.catch((error) => {
				console.log('Error while reading links json', error);
			});

		reader
			.getField('schedule.json')
			// @ts-ignore
			.then((_schedule: { time: number; location: string; name: string }[]) => {
				const mapped = _schedule
					.filter((event) => (event.time || 0) > Date.now())
					.sort((a, b) => a.time - b.time)
					.slice(0, 3)
					.map((event) => {
						const time = new Date(event.time);
						const hours = time.getHours().toString().padStart(2, '0');
						const minutes = time.getMinutes().toString().padStart(2, '0');

						return {
							time: hours + ':' + minutes,
							location: event.location,
							name: event.name,
						};
					});

				// @ts-ignore
				cache.schedule = mapped;
				setSchedule(mapped);
			})
			.catch((error) => {
				console.log('Error while reading schedule json', error);
			});
	}, [config, reader]);

	return (
		<BaseFeedWidget
			url={url}
			style={style}
			name={'Plan ₿ Forum'}
			isLoading={false}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<>
				{schedule.map((event) => (
					<View key={event.name} style={styles.row}>
						<View style={styles.columnLeft}>
							<Text02M color="gray1" style={styles.time}>
								{event.time}
							</Text02M>
							<Text02M color="gray1" numberOfLines={1}>
								{event.location}
							</Text02M>
						</View>
						<View style={styles.columnRight}>
							<Text01M numberOfLines={1}>{event.name}</Text01M>
						</View>
					</View>
				))}
				{banner && (
					<View style={styles.bannerContainer}>
						<Image source={{ uri: banner }} style={styles.banner} />
					</View>
				)}
				{links && (
					<View style={styles.linksContainer}>
						{links.map(
							(link, index): ReactElement => (
								<Button
									style={styles.link}
									text={link.name}
									key={link.name}
									icon={
										index === 0 ? (
											<CalendarIcon width={12} height={12} />
										) : index === 1 ? (
											<MapTrifoldIcon width={16} height={16} />
										) : (
											<MapPinLineIcon width={16} height={16} />
										)
									}
									onPress={(): void => {
										link.url &&
											openURL(
												link.url.startsWith('http')
													? link.url
													: 'https://' + link.url,
											);
									}}
								/>
							),
						)}
					</View>
				)}
				<View style={styles.source}>
					<View style={styles.sourceColumnLeft}>
						<Caption13M color="gray1" numberOfLines={1}>
							Treasure Chests Found: {numberOfChests} of 6
						</Caption13M>
					</View>
					<View style={styles.columnRight}>
						<TouchableOpacity
							activeOpacity={0.9}
							onPress={(): void => {
								openURL('https://bitkit.to/treasure-hunt');
							}}>
							<Caption13M color="gray1" numberOfLines={1}>
								bitkit.to
							</Caption13M>
						</TouchableOpacity>
					</View>
				</View>
			</>
		</BaseFeedWidget>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 28,
	},
	columnLeft: {
		width: 100,
		flexDirection: 'row',
		alignItems: 'center',
	},
	time: {
		width: 45,
		marginRight: 8,
	},
	columnRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	source: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sourceColumnLeft: {
		flex: 2,
		flexDirection: 'row',
		alignItems: 'center',
	},
	bannerContainer: {
		width: '100%',
		maxHeight: 180,
		borderRadius: 16,
		overflow: 'hidden',
		marginTop: 16,
	},
	linksContainer: {
		display: 'flex',
		flexDirection: 'row',
		paddingVertical: 16,
		columnGap: 4,
	},
	link: {
		flex: 1,
		minWidth: 0,
	},
	banner: {
		width: '100%',
		height: '100%',
	},
});

export default memo(LuganoWidget);
