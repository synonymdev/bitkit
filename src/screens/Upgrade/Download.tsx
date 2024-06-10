import React, { memo, ReactElement, useState } from 'react';
import {
	Image,
	LayoutChangeEvent,
	Linking,
	Pressable,
	StyleSheet,
	View,
} from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text2';
import Button from '../../components/Button';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { UpgradeScreenProps } from '../../navigation/types';

const image = require('../../assets/illustrations/phone.png');
const imageIos = require('../../assets/illustrations/download-ios.png');
const imageAndroid = require('../../assets/illustrations/download-android.png');

const appStoreUrl = 'https://apps.apple.com/app/bitkit-wallet/id6502440655';
const playStoreUrl = 'https://play.google.com/store/apps/details?id=to.bitkit';

const Download = ({
	navigation,
}: UpgradeScreenProps<'Download'>): ReactElement => {
	const { t } = useTranslation('other');
	const [isLarge, setIsLarge] = useState(false);

	const onLayout = (event: LayoutChangeEvent): void => {
		// add margin to the image container if the sheet is large
		if (event.nativeEvent.layout.height > 700) {
			setIsLarge(true);
		}
	};

	const onDownloadIos = (): void => {
		Linking.openURL(appStoreUrl);
	};

	const onDownloadAndroid = (): void => {
		Linking.openURL(playStoreUrl);
	};

	const onBack = (): void => {
		navigation.goBack();
	};

	const onContinue = (): void => {
		navigation.navigate('Restore');
	};

	return (
		<GradientView>
			<View style={styles.root} onLayout={onLayout}>
				<BottomSheetNavigationHeader
					title={t('upgrade.download.nav_title')}
					displayBackButton={false}
				/>
				<View style={styles.content}>
					<View
						// eslint-disable-next-line react-native/no-inline-styles
						style={[styles.imageContainer, { marginBottom: isLarge ? 32 : 0 }]}>
						<Image style={styles.image} source={image} />
					</View>
					<Display>
						<Trans
							t={t}
							i18nKey="upgrade.download.title"
							components={{ accent: <Display color="brand2" /> }}
						/>
					</Display>
					<View style={styles.download}>
						<Pressable style={styles.downloadLink} onPress={onDownloadIos}>
							<Image style={styles.downloadImage} source={imageIos} />
						</Pressable>
						<Pressable style={styles.downloadLink} onPress={onDownloadAndroid}>
							<Image style={styles.downloadImage} source={imageAndroid} />
						</Pressable>
					</View>
					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							variant="secondary"
							size="large"
							text={t('upgrade.download.cancel')}
							onPress={onBack}
						/>
						<Button
							style={styles.button}
							size="large"
							text={t('upgrade.download.continue')}
							onPress={onContinue}
						/>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: '80%',
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	download: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
		marginTop: 16,
		minHeight: 66,
	},
	downloadLink: {
		flex: 1,
		height: 44,
	},
	downloadImage: {
		height: 46,
		width: '100%',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Download);
