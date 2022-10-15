import React, { memo, ReactElement, useMemo } from 'react';
import Rate, { AndroidMarket } from 'react-native-rate';
import {
	Text,
	View,
	FlatList,
	Share,
	Image,
	Platform,
	StyleSheet,
	Pressable,
} from 'react-native';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import GlowingBackground from '../../../components/GlowingBackground';

import {
	BitkitIcon,
	EmailIcon,
	GithubIcon,
	GlobeIcon,
	MediumIcon,
	TwitterIcon,
} from '../../../styles/components';
import { openURL } from '../../../utils/helpers';

const imageSrc = require('../../../assets/powered-by.png');

const AboutSettings = ({ navigation }): ReactElement => {
	// TODO: add correct store IDs and test
	const appleAppID = '1634634088';
	const androidPackageName = 'to.synonym.bitkit';

	const appStoreUrl =
		Platform.OS === 'ios'
			? `https://apps.apple.com/us/app/bitkit/id${appleAppID}`
			: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Leave a review',
						type: 'button',
						onPress: (): void => {
							const options = {
								AppleAppID: appleAppID,
								GooglePackageName: androidPackageName,
								// OtherAndroidURL: 'http://www.randomappstore.com/app/47172391',
								preferredAndroidMarket: AndroidMarket.Google,
								preferInApp: Platform.OS !== 'android',
								openAppStoreIfInAppFails: true,
								fallbackPlatformURL: 'https://www.synonym.to/',
							};
							Rate.rate(options, (success, _errorMessage) => {
								if (success) {
									// TODO: show thank you message
								}
							});
						},
						hide: false,
					},
					{
						title: 'Frequently Asked Questions',
						type: 'button',
						onPress: (): void => {
							// TODO: update with correct url
							openURL('https://www.synonym.to/').then();
						},
						hide: false,
					},
					{
						title: 'Report a bug or contribute',
						type: 'button',
						onPress: (): void => {
							openURL('https://github.com/synonymdev/bitkit').then();
						},
						hide: false,
					},
					{
						title: 'Share Bitkit with a friend',
						type: 'button',
						onPress: async (): Promise<void> => {
							await Share.share({
								title: 'Bitkit',
								message: `Download Bitkit, Your Ultimate Bitcoin Toolkit. Handing you the keys to reshape your digital life. ${appStoreUrl}`,
							});
						},
						hide: false,
					},
					{
						title: 'Legal',
						type: 'button',
						onPress: (): void => {
							// TODO: update with correct url
							openURL('https://www.synonym.to/').then();
						},
						hide: false,
					},
					{
						title: 'Version',
						value: '1.0.0',
						type: 'textButton',
						onPress: (): void => {
							openURL('https://github.com/synonymdev/bitkit/releases').then();
						},
						hide: false,
					},
				],
			},
		],
		[appStoreUrl],
	);

	const headerComponent = (
		<SettingsView
			title="About Bitkit"
			listData={SettingsListData}
			showBackNavigation={true}>
			<Text style={styles.textIntro}>
				Bitkit hands you the keys to your money, profile, contacts, and web
				accounts.
			</Text>
			<Text style={styles.textIntro}>
				This{' '}
				<Text
					onPress={(): void => {
						navigation.navigate('EasterEgg');
					}}>
					Orange Pill
				</Text>{' '}
				was carefully crafted by: John, Reza, Paulo, Corey, Jason, Gr0kchain,
				Ar, Ivan, Instabot, Philipp, Miguel, Aldert, Sasha, Auwal, Pavel, and
				Jan-Willem from Synonym Software Ltd.
			</Text>
		</SettingsView>
	);

	const footerComponent = (
		<View style={styles.container}>
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
			<View style={styles.containerSocial}>
				<EmailIcon
					onPress={(): void => {
						openURL('mailto:info@synonym.to?subject=Bitkit');
					}}
					height={24}
					width={24}
				/>
				<GlobeIcon
					onPress={(): void => {
						openURL('https://bitkit.to');
					}}
					height={24}
					width={24}
				/>
				<TwitterIcon
					onPress={(): void => {
						openURL('https://twitter.com/bitkitwallet');
					}}
					height={24}
					width={24}
				/>
				<MediumIcon
					onPress={(): void => {
						openURL('https://medium.com/synonym-to');
					}}
					height={24}
					width={24}
				/>
				<GithubIcon
					onPress={(): void => {
						openURL('https://github.com/synonymdev');
					}}
					height={24}
					width={24}
				/>
			</View>
		</View>
	);

	return (
		<GlowingBackground bottomRight="#FF6600">
			<FlatList
				data={null}
				renderItem={null}
				ListHeaderComponent={headerComponent}
				ListFooterComponent={footerComponent}
			/>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		marginTop: 48,
	},
	containerSocial: {
		width: 300,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginBottom: 32,
	},
	logoContainer: {
		position: 'relative',
		marginBottom: 42,
		justifyContent: 'center',
		display: 'flex',
		alignItems: 'center',
	},
	logoLink: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: 65,
		width: 65,
	},
	textIntro: {
		fontStyle: 'normal',
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		display: 'flex',
		alignItems: 'center',
		letterSpacing: -0.4,
		color: '#8E8E93',
		paddingLeft: 16,
		paddingRight: 16,
		paddingBottom: 12,
		paddingTop: 12,
	},
	poweredBy: {
		position: 'absolute',
		bottom: -2,
		right: -65,
		height: 18,
		width: 165,
	},
});

export default memo(AboutSettings);
