import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Text02S, Subtitle } from '../styles/text';
import { AnimatedView } from '../styles/components';
import { FaceIdIcon, TouchIdIcon } from '../styles/icons';
import SafeAreaInset from './SafeAreaInset';
import GlowingBackground from './GlowingBackground';
import NavigationHeader from './NavigationHeader';
import { IsSensorAvailableResult } from './Biometrics';
import NumberPad from './NumberPad';
import Button from './Button';
import useColors from '../hooks/colors';
import { wipeApp } from '../store/utils/settings';
import { showBottomSheet } from '../store/utils/ui';
import { vibrate } from '../utils/helpers';
import rnBiometrics from '../utils/biometrics';
import { showToast } from '../utils/notifications';
import { setKeychainValue, getKeychainValue } from '../utils/keychain';
import BitkitLogo from '../assets/bitkit-logo.svg';

export const PIN_ATTEMPTS = '8';

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
	onSuccess: () => void;
	onShowBiotmetrics?: () => void;
}): ReactElement => {
	const { t } = useTranslation('security');
	const { brand, brand08 } = useColors();
	const [pin, setPin] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [attemptsRemaining, setAttemptsRemaining] = useState(0);
	const [biometryData, setBiometricData] = useState<IsSensorAvailableResult>();

	const handleOnPress = (key: string): void => {
		if (key === 'delete') {
			if (pin.length !== 0) {
				vibrate();
				setPin((p) => p.slice(0, -1));
			}
		} else {
			if (pin.length !== 4) {
				vibrate();
				setPin((p) => p + key);
			}
		}
	};

	// Reduce the amount of pin attempts remaining.
	const reducePinAttemptsRemaining = useCallback(async (): Promise<void> => {
		const _attemptsRemaining = attemptsRemaining - 1;
		await setKeychainValue({
			key: 'pinAttemptsRemaining',
			value: `${_attemptsRemaining}`,
		});
		setAttemptsRemaining(_attemptsRemaining);
	}, [attemptsRemaining]);

	// init view
	useEffect(() => {
		(async (): Promise<void> => {
			const attemptsRemainingResponse = await getKeychainValue({
				key: 'pinAttemptsRemaining',
			});

			if (
				!attemptsRemainingResponse.error &&
				Number(attemptsRemainingResponse.data) !== Number(attemptsRemaining)
			) {
				let numAttempts =
					attemptsRemainingResponse.data !== undefined
						? Number(attemptsRemainingResponse.data)
						: 5;
				setAttemptsRemaining(numAttempts);
			}
		})();
	}, [attemptsRemaining]);

	// on mount
	useEffect(() => {
		(async (): Promise<void> => {
			setIsLoading(true);
			// wait for initial keychain read
			await getKeychainValue({ key: 'pinAttemptsRemaining' });
			// get available biometrics
			const data = await rnBiometrics.isSensorAvailable();
			setBiometricData(data);
			setIsLoading(false);
		})();
	}, []);

	// submit pin
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (pin.length !== 4) {
				return;
			}

			const realPIN = await getKeychainValue({ key: 'pin' });

			// error getting pin
			if (realPIN.error) {
				await reducePinAttemptsRemaining();
				vibrate();
				setPin('');
				return;
			}

			// in correct pin
			if (pin !== realPIN?.data) {
				if (attemptsRemaining <= 1) {
					vibrate({ type: 'default' });
					await wipeApp();
					showToast({
						type: 'error',
						title: t('wiped_title'),
						description: t('wiped_message'),
					});
				} else {
					await reducePinAttemptsRemaining();
				}

				vibrate();
				setPin('');
				return;
			}

			// correct pin
			await setKeychainValue({
				key: 'pinAttemptsRemaining',
				value: PIN_ATTEMPTS,
			});
			setPin('');
			onSuccess?.();
		}, 500);

		return (): void => clearTimeout(timer);
	}, [pin, attemptsRemaining, onSuccess, reducePinAttemptsRemaining, t]);

	const isLastAttempt = attemptsRemaining === 1;

	const biometricsName =
		biometryData?.biometryType === 'TouchID'
			? t('bio_touch_id')
			: biometryData?.biometryType === 'FaceID'
			? t('bio_face_id')
			: biometryData?.biometryType ?? t('bio');

	return (
		<GlowingBackground topLeft="brand">
			<View style={styles.header}>
				<SafeAreaInset type="top" />
				<NavigationHeader displayBackButton={showBackNavigation} />
			</View>
			<View style={styles.container} testID="PinPad">
				<View style={styles.logo}>
					{showLogoOnPIN && <BitkitLogo height={64} width={184} />}
				</View>

				<View style={styles.content}>
					{!isLoading && (
						<AnimatedView
							style={styles.contentInner}
							color="transparent"
							entering={FadeIn}
							exiting={FadeOut}>
							<Subtitle style={styles.title}>{t('pin_enter')}</Subtitle>

							{attemptsRemaining !== Number(PIN_ATTEMPTS) && (
								<AnimatedView
									style={styles.attempts}
									color="transparent"
									entering={FadeIn}
									exiting={FadeOut}>
									{isLastAttempt ? (
										<Text02S style={styles.attemptsRemaining} color="brand">
											{t('pin_last_attempt')}
										</Text02S>
									) : (
										<Pressable
											onPress={(): void => {
												showBottomSheet('forgotPIN');
											}}>
											<Text02S testID="AttemptsRemaining" color="brand">
												{t('pin_attempts', { attemptsRemaining })}
											</Text02S>
										</Pressable>
									)}
								</AnimatedView>
							)}

							{allowBiometrics && (
								<Button
									style={styles.biometrics}
									text={t('pin_use_biometrics', { biometricsName })}
									icon={
										biometryData?.biometryType === 'FaceID' ? (
											<FaceIdIcon height={16} width={16} color="brand" />
										) : (
											<TouchIdIcon height={16} width={16} color="brand" />
										)
									}
									onPress={onShowBiotmetrics}
								/>
							)}

							<View style={styles.dots}>
								{Array(4)
									.fill(null)
									.map((_, i) => (
										<View
											key={i}
											style={[
												styles.dot,
												{
													borderColor: brand,
													backgroundColor:
														pin[i] === undefined ? brand08 : brand,
												},
											]}
										/>
									))}
							</View>

							<NumberPad
								style={styles.numberpad}
								type="simple"
								onPress={handleOnPress}
							/>
						</AnimatedView>
					)}
				</View>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
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
		justifyContent: 'center',
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
		marginBottom: 32,
	},
	attempts: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	attemptsRemaining: {
		textAlign: 'center',
	},
	biometrics: {
		alignSelf: 'center',
		marginBottom: 16,
	},
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 32,
	},
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		marginHorizontal: 12,
		borderWidth: 1,
	},
	numberpad: {
		marginTop: 'auto',
		maxHeight: 410,
	},
});

export default memo(PinPad);
