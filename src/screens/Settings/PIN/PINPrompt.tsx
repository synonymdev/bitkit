import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GlowImage from '../../../components/GlowImage';
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
			<Text01S color="white50">{t('pin_security_text')}</Text01S>

			<GlowImage image={imageSrc} imageSize={150} glowColor="green" />

			<View style={styles.buttonContainer}>
				{showLaterButton && (
					<>
						<Button
							style={styles.button}
							size="large"
							variant="secondary"
							text={t('later')}
							onPress={onDismiss}
						/>
						<View style={styles.divider} />
					</>
				)}
				<Button
					style={styles.button}
					size="large"
					text={t('pin_security_button')}
					onPress={onContinue}
					testID="SecureWallet"
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(PINPrompt);
