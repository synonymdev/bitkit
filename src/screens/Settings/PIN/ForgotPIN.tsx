import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM } from '../../../styles/text';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import { closeSheet } from '../../../store/slices/ui';
import { wipeApp } from '../../../store/utils/settings';
import { useAppDispatch } from '../../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';

const imageSrc = require('../../../assets/illustrations/restore.png');

const ForgotPIN = (): ReactElement => {
	const { t } = useTranslation('security');
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();

	useBottomSheetBackPress('forgotPIN');

	const handlePress = (): void => {
		wipeApp();
		dispatch(closeSheet('forgotPIN'));
	};

	return (
		<BottomSheetWrapper
			view="forgotPIN"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('pin_forgot_title')}
					displayBackButton={false}
				/>
				<BodyM color="secondary">{t('pin_forgot_text')}</BodyM>

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
		</BottomSheetWrapper>
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
