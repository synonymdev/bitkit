import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyM, Display } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { closeSheet } from '../../../store/slices/ui';
import { showLaterButtonSelector } from '../../../store/reselect/ui';
import { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = ({
	navigation,
}: PinScreenProps<'PINPrompt'>): ReactElement => {
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const showLaterButton = useAppSelector(showLaterButtonSelector);

	useBottomSheetBackPress('PINNavigation');

	const onContinue = (): void => {
		navigation.navigate('ChoosePIN');
	};

	const onDismiss = (): void => {
		dispatch(closeSheet('PINNavigation'));
	};

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('pin_security_header')}
				displayBackButton={false}
			/>
			<Image style={styles.image} source={imageSrc} />
			<Display>
				<Trans
					t={t}
					i18nKey="pin_security_title"
					components={{ accent: <Display color="green" /> }}
				/>
			</Display>
			<BodyM color="secondary">{t('pin_security_text')}</BodyM>
			<View style={styles.buttonContainer}>
				{showLaterButton && (
					<Button
						style={styles.button}
						size="large"
						variant="secondary"
						text={t('later')}
						onPress={onDismiss}
					/>
				)}
				<Button
					style={styles.button}
					size="large"
					text={t('pin_security_button')}
					testID="SecureWallet"
					onPress={onContinue}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 32,
	},
	image: {
		flex: 1,
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		resizeMode: 'contain',
		marginTop: 'auto',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 32,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(PINPrompt);
