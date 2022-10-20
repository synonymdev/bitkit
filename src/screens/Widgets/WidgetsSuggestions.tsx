import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import {
	ChartLineIcon,
	NewspaperIcon,
	Title,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import DetectSwipe from '../../components/DetectSwipe';
import Divider from '../../components/Divider';
import Button from '../../components/Button';
import { handleSlashtagURL } from '../../utils/slashtags';
import type { WidgetsScreenProps } from '../../navigation/types';

const PriceFeedURL =
	'slashfeed:kgw7hqj4usek78smxczgrcxqn313s7qnpnc7so7guegziwjic6yy#encryptionKey=nds189gg3hgpei45y79f9ho6s6yh4sm3su1bw4yktt9gtggxtxty';
const NewsFeedURL =
	'slashfeed:jh7fzqcngzwq79e645x8p81kpn5ch8ybi6n4d571jyczd3qr1psy#encryptionKey=yrrfn8n3guaonho4oafgic7xcmbjwfhb6ihxguqjaqf1mwhpxeco';
const BlocksFeedURL =
	'slashfeed:gpjjokcczfyitc1phrr5x3t6ac5friifderx6ot51mtkjmn9seqo#encryptionKey=jo6nybw8f3hzwea8jzcoyiymgimhfo4ftao93jxcinurgfrcxaay';

const WidgetsSuggetsions = ({
	navigation,
}: WidgetsScreenProps<'WidgetsSuggestions'>): JSX.Element => {
	const onSwipeRight = (): void => {
		navigation.navigate('Tabs');
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Widget"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<DetectSwipe onSwipeRight={onSwipeRight}>
				<View style={styles.content}>
					<ScrollView>
						<Feed
							icon={<ChartLineIcon />}
							title="Bitcoin Price"
							url={PriceFeedURL}
						/>
						<Feed
							icon={<NewspaperIcon />}
							title="Bitcoin Headlines"
							url={NewsFeedURL}
						/>
						<Feed
							icon={<NewspaperIcon />}
							title="Bitcoin Blocks"
							url={BlocksFeedURL}
						/>
						<SafeAreaInsets type="bottom" />
					</ScrollView>
					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text="Or Scan QR"
							size="large"
							onPress={(): void => {
								navigation.navigate('Scanner');
							}}
						/>
					</View>
				</View>
			</DetectSwipe>
			<SafeAreaInsets type="bottom" />
		</View>
	);
};

const Feed = ({
	icon,
	title,
	url,
}: {
	icon: JSX.Element;
	title: string;
	url: string;
}): JSX.Element => {
	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={(): void => {
				handleSlashtagURL(url);
			}}>
			<View style={styles.feed}>
				<View style={styles.icon}>{icon}</View>
				<Title>{title}</Title>
			</View>
			<Divider style={styles.divider} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	feed: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	divider: {
		marginTop: 24,
		marginBottom: 24,
	},
	icon: {
		marginRight: 16,
		borderRadius: 8,
		overflow: 'hidden',
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default WidgetsSuggetsions;
