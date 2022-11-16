import React, {
	memo,
	ReactElement,
	// useCallback,
	useMemo,
	// useState,
} from 'react';
// import Rate, { AndroidMarket } from 'react-native-rate';
import {
	View,
	FlatList,
	Image,
	// Share,
	// Platform,
	StyleSheet,
	Pressable,
} from 'react-native';
import { getBuildNumber, getVersion } from 'react-native-device-info';

import {
	BitkitIcon,
	EmailIcon,
	GithubIcon,
	GlobeIcon,
	MediumIcon,
	Text01S,
	TwitterIcon,
} from '../../../styles/components';
import { IListData } from '../../../components/List';
import GlowingBackground from '../../../components/GlowingBackground';
import { openURL } from '../../../utils/helpers';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import SettingsView from '../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/powered-by.png');

const About = ({
	navigation,
}: SettingsScreenProps<'AboutSettings'>): ReactElement => {
	// TODO: uncomment links after full launch

	// const [isReviewing, setIsReviewing] = useState(false);

	// TODO: add correct store IDs and test
	// const appleAppID = '1634634088';
	// const androidPackageName = 'to.synonym.bitkit';

	// const appStoreUrl =
	// 	Platform.OS === 'ios'
	// 		? `https://apps.apple.com/us/app/bitkit/id${appleAppID}`
	// 		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

	// const onReview = useCallback((): void => {
	// 	setIsReviewing(true);
	// 	const options = {
	// 		AppleAppID: appleAppID,
	// 		GooglePackageName: androidPackageName,
	// 		// OtherAndroidURL: 'http://www.randomappstore.com/app/47172391',
	// 		preferredAndroidMarket: AndroidMarket.Google,
	// 		preferInApp: Platform.OS !== 'android',
	// 		openAppStoreIfInAppFails: true,
	// 		fallbackPlatformURL: 'https://www.bitkit.to/',
	// 	};
	// 	Rate.rate(options, (success, _errorMessage) => {
	// 		if (success) {
	// 			// TODO: show thank you message
	// 		}

	// 		setIsReviewing(false);
	// 	});
	// }, []);

	// const onShare = useCallback(async (): Promise<void> => {
	// 	await Share.share({
	// 		title: 'Bitkit',
	// 		message: `Download Bitkit, Your Ultimate Bitcoin Toolkit. Handing you the keys to reshape your digital life. ${appStoreUrl}`,
	// 	});
	// }, []);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					// {
					// 	title: 'Leave a review',
					// 	type: 'button',
					// 	disabled: isReviewing,
					// 	onPress: onReview,
					// },
					// {
					// 	title: 'Frequently Asked Questions',
					// 	type: 'button',
					// 	onPress: (): void => {
					// 		// TODO: update with correct url
					// 		openURL('https://www.synonym.to/').then();
					// 	},
					// },
					{
						title: 'Report a bug or contribute',
						type: 'button',
						onPress: (): void => {
							openURL('https://www.github.com/synonymdev/bitkit').then();
						},
					},
					// {
					// 	title: 'Share Bitkit with a friend',
					// 	type: 'button',
					// 	onPress: onShare,
					// },
					{
						title: 'Legal',
						type: 'button',
						onPress: (): void => {
							// TODO: update with correct url
							openURL('https://www.bitkit.to/terms-of-use').then();
						},
					},
					{
						title: 'Version',
						value: `${getVersion()} (${getBuildNumber()})`,
						type: 'textButton',
						onPress: (): void => {
							openURL(
								'https://www.github.com/synonymdev/bitkit/releases',
							).then();
						},
					},
				],
			},
		],
		// [isReviewing],
		[],
	);

	const headerComponent = (
		<SettingsView
			title="About Bitkit"
			listData={SettingsListData}
			showBackNavigation={true}>
			<Text01S style={styles.text} color="gray1">
				Bitkit hands you the keys to your money, profile, contacts, and web
				accounts.{'\n'}
				{'\n'}This{' '}
				<Text01S
					color="gray1"
					onPress={(): void => {
						navigation.navigate('EasterEgg');
					}}>
					Orange Pill
				</Text01S>{' '}
				was carefully crafted by:{'\n'}John, Reza, Paulo, Corey, Jason,
				Gr0kchain, Ar, Ivan, Instabot, Philipp, Miguel, Aldert, Sasha, Auwal,
				Pavel, and Jan-Willem from Synonym Software Ltd.
			</Text01S>
		</SettingsView>
	);

	return (
		<GlowingBackground bottomRight="#FF6600">
			<FlatList
				data={null}
				renderItem={null}
				ListHeaderComponent={headerComponent}
			/>
			<View style={styles.footer}>
				<View style={styles.logoContainer}>
					<Pressable
						style={styles.logoLink}
						onPress={(): void => {
							navigation.navigate('EasterEgg');
						}}
					/>
					<BitkitIcon height={64} width={184} />
					<Image style={styles.poweredBy} source={imageSrc} />
				</View>
				<View style={styles.socialLinks}>
					<Pressable
						style={styles.socialLink}
						onPress={(): void => {
							openURL('mailto:support@synonym.to?subject=Bitkit');
						}}>
						<EmailIcon height={24} width={24} />
					</Pressable>
					<Pressable
						style={styles.socialLink}
						onPress={(): void => {
							openURL('https://www.bitkit.to');
						}}>
						<GlobeIcon height={24} width={24} />
					</Pressable>
					<Pressable
						style={styles.socialLink}
						onPress={(): void => {
							openURL('https://www.twitter.com/bitkitwallet');
						}}>
						<TwitterIcon height={24} width={24} />
					</Pressable>
					<Pressable
						style={styles.socialLink}
						onPress={(): void => {
							openURL('https://www.medium.com/synonym-to');
						}}>
						<MediumIcon height={24} width={24} />
					</Pressable>
					<Pressable
						style={styles.socialLink}
						onPress={(): void => {
							openURL('https://www.github.com/synonymdev');
						}}>
						<GithubIcon height={24} width={24} />
					</Pressable>
				</View>
			</View>

			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	text: {
		paddingHorizontal: 16,
		paddingBottom: 32,
	},
	footer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 'auto',
		marginBottom: 32,
	},
	logoContainer: {
		position: 'relative',
		marginBottom: 38,
		justifyContent: 'center',
		alignItems: 'center',
	},
	logoLink: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: 65,
		width: 65,
		zIndex: 1,
	},
	poweredBy: {
		position: 'absolute',
		bottom: -2,
		right: -65,
		height: 18,
		width: 165,
	},
	socialLinks: {
		width: 300,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
	},
	socialLink: {
		padding: 4,
	},
});

export default memo(About);
