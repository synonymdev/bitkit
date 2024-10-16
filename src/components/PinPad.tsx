import React, { ReactElement, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import BitkitLogo from '../assets/bitkit-logo.svg';
import { PIN_ATTEMPTS } from '../constants/app';
import usePIN from '../hooks/pin';
import { showBottomSheet } from '../store/utils/ui';
import { AnimatedView, View as ThemedView } from '../styles/components';
import { FaceIdIcon, TouchIdIcon } from '../styles/icons';
import { BodyS, Subtitle } from '../styles/text';
import rnBiometrics from '../utils/biometrics';
import { IsSensorAvailableResult } from './Biometrics';
import NavigationHeader from './NavigationHeader';
import NumberPad from './NumberPad';
import SafeAreaInset from './SafeAreaInset';
import Button from './buttons/Button';

const PinPad = ({
	showLogoOnPIN,
	allowBiometrics,
	showBackNavigation = true,
	onSuccess,
	onShowBiotmetrics,
}: {
	showLogoOnPIN: boolean;
	allowBiometrics: boolean;
	showBackNavigation?: boolean;
	onSuccess?: () => void;
	onShowBiotmetrics?: () => void;
}): ReactElement => {
	const { t } = useTranslation('security');
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();
	const { attemptsRemaining, Dots, handleNumberPress, isLastAttempt, loading } =
		usePIN(onSuccess);

	// on mount
	useEffect(() => {
		(async (): Promise<void> => {
			const data = await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
		})();
	}, []);

	const biometricsName =
		biometryData?.biometryType === 'TouchID'
			? t('bio_touch_id')
			: biometryData?.biometryType === 'FaceID'
			? t('bio_face_id')
			: biometryData?.biometryType ?? t('bio');

	return (
		<ThemedView style={styles.root}>
			<View style={styles.header}>
				<SafeAreaInset type="top" />
				<NavigationHeader displayBackButton={showBackNavigation} />
			</View>
			<View style={styles.container} testID="PinPad">
				<View style={styles.logo}>
					{showLogoOnPIN && <BitkitLogo height={82} width={280} />}
				</View>

				<View style={styles.content}>
					{!loading && biometryData !== undefined && (
						<AnimatedView
							style={styles.contentInner}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Subtitle testID="PinEnterSubtitle" style={styles.title}>
								{t('pin_enter')}
							</Subtitle>

							<View style={styles.actions}>
								{attemptsRemaining !== Number(PIN_ATTEMPTS) && (
									<AnimatedView
										style={styles.attempts}
										color="transparent"
										entering={FadeIn}
										exiting={FadeOut}>
										{isLastAttempt ? (
											<BodyS style={styles.attemptsRemaining} color="brand">
												{t('pin_last_attempt')}
											</BodyS>
										) : (
											<Pressable
												onPress={(): void => {
													showBottomSheet('forgotPIN');
												}}>
												<BodyS testID="AttemptsRemaining" color="brand">
													{t('pin_attempts', { attemptsRemaining })}
												</BodyS>
											</Pressable>
										)}
									</AnimatedView>
								)}

								{allowBiometrics && (
									<Button
										style={styles.biometrics}
										text={t('pin_use_biometrics', { biometricsName })}
										onPress={onShowBiotmetrics}
										icon={
											biometryData?.biometryType === 'FaceID' ? (
												<FaceIdIcon height={16} width={16} color="brand" />
											) : (
												<TouchIdIcon height={16} width={16} color="brand" />
											)
										}
									/>
								)}
							</View>

							<View style={styles.dots}>
								<Dots />
							</View>

							<NumberPad
								style={styles.numberpad}
								type="simple"
								onPress={handleNumberPress}
							/>
						</AnimatedView>
					)}
				</View>
			</View>
			<SafeAreaInset type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	header: {
		position: 'absolute',
		top: 0,
		zIndex: 1,
	},
	container: {
		flex: 1,
		justifyContent: 'space-between',
	},
	logo: {
		flex: 1.2,
		alignSelf: 'center',
		justifyContent: 'flex-end',
	},
	content: {
		flex: 2,
		marginTop: 'auto',
	},
	contentInner: {
		flex: 1,
	},
	title: {
		textAlign: 'center',
		marginTop: 'auto',
		marginBottom: 32,
	},
	actions: {
		marginBottom: 16,
		minHeight: 19,
	},
	attempts: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	attemptsRemaining: {
		textAlign: 'center',
	},
	biometrics: {
		alignSelf: 'center',
		marginBottom: 16,
	},
	dots: {
		borderRadius: 10,
		marginHorizontal: 12,
		borderWidth: 1,
	},
	numberpad: {
		maxHeight: 310,
	},
});

export default memo(PinPad);
