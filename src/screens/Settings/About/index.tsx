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
	Image,
	// Share,
	// Platform,
	StyleSheet,
	Pressable,
} from 'react-native';
import {
	getBuildNumber,
	// getBundleId,
	getVersion,
} from 'react-native-device-info';
import { Trans, useTranslation } from 'react-i18next';

import { Text01S } from '../../../styles/text';
import {
	BitkitIcon,
	EmailIcon,
	GithubIcon,
	GlobeIcon,
	MediumIcon,
	TwitterIcon,
} from '../../../styles/icons';
import { openURL } from '../../../utils/helpers';
import { createSupportLink } from '../../../utils/support';
import NavigationHeader from '../../../components/NavigationHeader';
import List, { EItemType, IListData } from '../../../components/List';
import GlowingBackground from '../../../components/GlowingBackground';
import SafeAreaInset from '../../../components/SafeAreaInset';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/powered-by.png');

// TODO: add correct store IDs and test
// const appleAppID = '1634634088';
// const androidPackageName = getBundleId();
// const appStoreUrl =
// 	Platform.OS === 'ios'
// 		? `https://apps.apple.com/us/app/bitkit/id${appleAppID}`
// 		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

const About = ({
	navigation,
}: SettingsScreenProps<'AboutSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	// TODO: uncomment links after full launch

	// const [isReviewing, setIsReviewing] = useState(false);

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

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					// {
					// 	title: 'Leave a review',
					// 	type: EItemType.button,
					// 	disabled: isReviewing,
					// 	onPress: onReview,
					// },
					// {
					// 	title: 'Frequently Asked Questions',
					// 	type: EItemType.button,
					// 	onPress: (): void => {
					// 		// TODO: update with correct url
					// 		openURL('https://www.synonym.to/').then();
					// 	},
					// },
					{
						title: t('about.support'),
						type: EItemType.button,
						onPress: async (): Promise<void> => {
							const link = await createSupportLink();
							const openUrlSuccess = await openURL(link);
							if (!openUrlSuccess) {
								//If unable to open mail app for any reason, open contact page in browser.
								await openURL('https://synonym.to/contact');
							}
						},
					},
					{
						title: t('about.report_bug'),
						type: EItemType.button,
						onPress: (): void => {
							openURL('https://www.github.com/synonymdev/bitkit').then();
						},
					},
					// {
					// 	title: 'Share Bitkit with a friend',
					// 	type: EItemType.button,
					// 	onPress: onShare,
					// },
					{
						title: t('about.legal'),
						type: EItemType.button,
						onPress: (): void => {
							// TODO: update with correct url
							openURL('https://www.bitkit.to/terms-of-use').then();
						},
					},
					{
						title: t('about.version'),
						value: `${getVersion()} (${getBuildNumber()})`,
						type: EItemType.textButton,
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
		[t],
	);

	return (
		<GlowingBackground bottomRight="brand">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('about.title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<Text01S style={styles.text} color="gray1">
					<Trans
						t={t}
						i18nKey="about.text"
						components={{
							easterEgg: (
								<Text01S
									color="gray1"
									onPress={(): void => {
										navigation.navigate('EasterEgg');
									}}
								/>
							),
						}}
					/>
				</Text01S>

				<List style={styles.list} data={settingsListData} bounces={false} />

				<View style={styles.footer}>
					<View style={styles.logoContainer}>
						<Pressable
							style={styles.logoLink}
							onPress={(): void => {
								navigation.navigate('EasterEgg');
							}}
							testID="Logo"
						/>
						<BitkitIcon height={64} width={184} />
						<Image style={styles.poweredBy} source={imageSrc} />
					</View>
					<View style={styles.socialLinks}>
						<Pressable
							style={styles.socialLink}
							onPress={async (): Promise<void> => {
								await openURL(await createSupportLink());
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

				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	text: {
		paddingBottom: 32,
	},
	list: {
		marginBottom: 32,
	},
	footer: {
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
