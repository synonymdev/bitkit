import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeBottomSheet } from '../../../store/actions/ui';
import { showLaterButtonSelector } from '../../../store/reselect/ui';
import { useAppSelector } from '../../../hooks/redux';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = ({
	navigation,
}: PinScreenProps<'PINPrompt'>): ReactElement => {
	const { t } = useTranslation('security');
	const insets = useSafeAreaInsets();
	const showLaterButton = useAppSelector(showLaterButtonSelector);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('PINNavigation');

	const onContinue = (): void => {
		navigation.navigate('ChoosePIN');
	};

	const onDismiss = (): void => {
		closeBottomSheet('PINNavigation');
	};

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('pin_security_header')}
				displayBackButton={false}
			/>
			<Text01S color="white5">{t('pin_security_text')}</Text01S>

			<GlowImage image={imageSrc} imageSize={150} glowColor="green" />

			<View style={buttonContainerStyles}>
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
