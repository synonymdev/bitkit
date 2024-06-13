import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	// useState,
} from 'react';
// import Rate, { AndroidMarket } from 'react-native-rate';
import { View, Image, Share, StyleSheet } from 'react-native';
import { getBuildNumber, getVersion } from 'react-native-device-info';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { EItemType, IListData } from '../../../components/List';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Social from '../../../components/Social';
import SettingsView from '../SettingsView';
import { openURL } from '../../../utils/helpers';
import { appName, appStoreUrl, playStoreUrl } from '../../../constants/app';

const imageSrc = require('../../../assets/logo.png');

const About = (): ReactElement => {
	const { t } = useTranslation('settings');
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

	const onShare = useCallback(async (): Promise<void> => {
		await Share.share({
			title: appName,
			message: t('about.shareText', { playStoreUrl, appStoreUrl }),
		});
	}, [t]);

	const listData: IListData[] = useMemo(
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
						title: t('about.legal'),
						type: EItemType.button,
						onPress: (): void => {
							openURL('https://www.bitkit.to/terms-of-use').then();
						},
					},
					{
						title: t('about.share'),
						type: EItemType.button,
						onPress: onShare,
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
		[onShare, t],
	);

	return (
		<ThemedView style={styles.root}>
			<SettingsView
				headerText={t('about.text')}
				title={t('about.title')}
				listData={listData}
				fullHeight={false}
			/>
			<View style={styles.imageContainer} testID="AboutLogo">
				<Image style={styles.image} source={imageSrc} />
			</View>
			<Social style={styles.social} />
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		marginTop: 'auto',
		height: 82,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	social: {
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
});

export default memo(About);
