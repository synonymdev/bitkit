import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import {
	ChartLineIcon,
	NewspaperIcon,
	Title,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { navigate } from '../../navigation/root/RootNavigator';
import DetectSwipe from '../../components/DetectSwipe';
import Divider from '../../components/Divider';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Button from '../../components/Button';
import { handleSlashtagURL } from '../../utils/slashtags';

const PriceFeedURL =
	'slashfeed:kgw7hqj4usek78smxczgrcxqn313s7qnpnc7so7guegziwjic6yy#encryptionKey=nds189gg3hgpei45y79f9ho6s6yh4sm3su1bw4yktt9gtggxtxty';
const NewsFeedURL =
	'slashfeed:jh7fzqcngzwq79e645x8p81kpn5ch8ybi6n4d571jyczd3qr1psy#encryptionKey=yrrfn8n3guaonho4oafgic7xcmbjwfhb6ihxguqjaqf1mwhpxeco';

const WidgetsSuggetsions = (): JSX.Element => {
	const onSwipeLeft = (): void => {
		navigate('Tabs', {});
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				style={styles.header}
				title="Add Widget"
				onClosePress={(): void => {
					navigate('Tabs', {});
				}}
			/>
			<DetectSwipe onSwipeLeft={onSwipeLeft}>
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
						<SafeAreaInsets type="bottom" />
					</ScrollView>
					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text="Scan QR To Add"
							size="large"
							onPress={(): void => {
								navigate('Scanner', {});
							}}
						/>
					</View>
				</View>
			</DetectSwipe>
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
			style={styles.feedContainer}
			onPress={(): void => {
				handleSlashtagURL(url);
			}}>
			<View style={styles.feedRow}>
				<View style={styles.icon}>{icon}</View>
				<Title>{title}</Title>
			</View>
			<Divider />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	header: {
		paddingBottom: 12,
	},
	feedContainer: {
		marginTop: 16,
	},
	feedRow: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		marginRight: 16,
		borderRadius: 8,
		overflow: 'hidden',
	},
	buttonContainer: {
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
});

export default WidgetsSuggetsions;
