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

import { BodyS, Subtitle } from '../styles/text';
import { View as ThemedView, AnimatedView } from '../styles/components';
import { FaceIdIcon, TouchIdIcon } from '../styles/icons';
import SafeAreaInset from './SafeAreaInset';
import NavigationHeader from './NavigationHeader';
import { IsSensorAvailableResult } from './Biometrics';
import NumberPad from './NumberPad';
import Button from './buttons/Button';
import useColors from '../hooks/colors';
import { wipeApp } from '../store/utils/settings';
import { showBottomSheet } from '../store/utils/ui';
import { vibrate } from '../utils/helpers';
import rnBiometrics from '../utils/biometrics';
import { showToast } from '../utils/notifications';
import { setKeychainValue, getKeychainValue } from '../utils/keychain';
import BitkitLogo from '../assets/bitkit-logo.svg';
import { PIN_ATTEMPTS } from '../constants/app';

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
		vibrate();
		if (key === 'delete') {
			setPin((p) => {
				return p.length === 0 ? '' : p.slice(0, -1);
			});
		} else {
			setPin((p) => {
				return p.length === 4 ? p : p + key;
			});
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

			// incorrect pin
			if (pin !== realPIN?.data) {
				if (attemptsRemaining <= 1) {
					vibrate({ type: 'default' });
					await wipeApp();
					showToast({
						type: 'warning',
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
					{!isLoading && (
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
							</View>

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
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 48,
	},
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		marginHorizontal: 12,
		borderWidth: 1,
	},
	numberpad: {
		maxHeight: 310,
	},
});

export default memo(PinPad);
