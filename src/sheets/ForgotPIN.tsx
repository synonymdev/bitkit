import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import BottomSheetNavigationHeader from '../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../components/SafeAreaInset';
import Button from '../components/buttons/Button';
import { wipeApp } from '../store/utils/settings';
import { BodyM } from '../styles/text';
import { useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/restore.png');

const sheetId = 'forgotPin';

const ForgotPIN = (): ReactElement => {
	const { t } = useTranslation('security');
	const sheetRef = useSheetRef(sheetId);

	const handlePress = (): void => {
		wipeApp();
		sheetRef.current?.close();
	};

	return (
		<BottomSheet id={sheetId} size="large">
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('pin_forgot_title')}
					showBackButton={false}
				/>
				<BodyM testID="ForgotPIN" color="secondary">
					{t('pin_forgot_text')}
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text={t('pin_forgot_reset')}
						onPress={handlePress}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheet>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	imageContainer: {
		alignItems: 'center',
		marginTop: 'auto',
		aspectRatio: 1,
		width: 256,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
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

export default memo(ForgotPIN);
