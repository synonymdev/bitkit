import React, { memo, ReactElement } from 'react';
import { View, Image, StyleSheet, Share, Platform } from 'react-native';
import { getBundleId } from 'react-native-device-info';
import { Trans, useTranslation } from 'react-i18next';

import Button from '../../../components/Button';
import GlowingBackground from '../../../components/GlowingBackground';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { Display } from '../../../styles/text';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/orange-pill.png');

// TODO: add correct store IDs and test
// const appleAppID = '1634634088';
const androidPackageName = getBundleId();
const appStoreUrl =
	Platform.OS === 'ios'
		? 'https://testflight.apple.com/join/lGXhnwcC'
		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

const EasterEgg = ({
	navigation,
}: SettingsScreenProps<'EasterEgg'>): ReactElement => {
	const { t } = useTranslation('settings');

	const onShare = async (): Promise<void> => {
		await Share.share({
			title: 'Bitkit',
			message: t('about.op_message', { appStoreUrl }),
		});
	};

	return (
		<GlowingBackground bottomRight="brand">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('about.op_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.root} testID="EasterEgg">
				<View style={styles.alignCenter}>
					<Image source={imageSrc} />
				</View>
				<View style={styles.intro}>
					<Display color="white" style={styles.text}>
						<Trans
							t={t}
							i18nKey="about.op_text"
							parent={Display}
							components={{
								brand: <Display color="brand" style={styles.text} />,
							}}
						/>
					</Display>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('about.op_share')}
						size="large"
						onPress={onShare}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
	},
	intro: {
		marginBottom: 40,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	text: {
		fontStyle: 'normal',
		fontWeight: '700',
		fontSize: 48,
		lineHeight: 48,
		marginLeft: 16,
		marginRight: 16,
		width: '100%',
		maxWidth: 281,
	},
	alignCenter: {
		alignItems: 'center',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default memo(EasterEgg);
