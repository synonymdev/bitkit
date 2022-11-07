import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View, LayoutAnimation, Pressable } from 'react-native';

import { Text02S, Subtitle, AnimatedView } from '../styles/components';
import NumberPad from './NumberPad';
import SafeAreaInsets from './SafeAreaInsets';
import GlowingBackground from './GlowingBackground';
import useColors from '../hooks/colors';
import { wipeApp } from '../store/actions/settings';
import { setKeychainValue, getKeychainValue, vibrate } from '../utils/helpers';
import BitkitLogo from '../assets/bitkit-logo.svg';
import { toggleView } from '../store/actions/user';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import NavigationHeader from './NavigationHeader';
import { showErrorNotification } from '../utils/notifications';

export const PIN_ATTEMPTS = '8';

const PinPad = ({
	onSuccess,
	showLogoOnPIN,
	showBackNavigation = true,
}: {
	onSuccess: () => void;
	showLogoOnPIN: boolean;
	showBackNavigation?: boolean;
}): ReactElement => {
	const [pin, setPin] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [attemptsRemaining, setAttemptsRemaining] = useState(0);
	const { brand, brand08 } = useColors();

	const handleOnPress = (number: number | string): void => {
		if (pin.length !== 4) {
			vibrate({});
			setPin((p) => p + String(number));
		}
	};

	const handleOnRemove = (): void => {
		if (pin.length !== 0) {
			vibrate({});
			setPin((p) => p.slice(0, -1));
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

	useEffect(() => LayoutAnimation.easeInEaseOut());

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

	// on mount wait for initial keychain read
	useEffect(() => {
		(async (): Promise<void> => {
			setIsLoading(true);
			await getKeychainValue({ key: 'pinAttemptsRemaining' });
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
				vibrate({});
				setPin('');
				return;
			}

			// in correct pin
			if (pin !== realPIN?.data) {
				if (attemptsRemaining <= 1) {
					vibrate({ type: 'default' });
					await wipeApp({});
					showErrorNotification({
						title: 'Bitkit Wiped',
						message: 'All wallet data has been wiped.',
					});
				} else {
					await reducePinAttemptsRemaining();
				}

				vibrate({});
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
		return (): void => clearInterval(timer);
	}, [pin, attemptsRemaining, onSuccess, reducePinAttemptsRemaining]);

	const isLastAttempt = attemptsRemaining === 1;

	return (
		<GlowingBackground topLeft={brand}>
			<View style={styles.header}>
				<SafeAreaInsets type="top" />
				<NavigationHeader displayBackButton={showBackNavigation} />
			</View>
			<View style={styles.container}>
				<View style={styles.logo}>
					{showLogoOnPIN && <BitkitLogo height={64} width={184} />}
				</View>

				{!isLoading && (
					<AnimatedView
						style={styles.content}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
						<Subtitle style={styles.title}>Please enter your PIN code</Subtitle>

						{attemptsRemaining !== Number(PIN_ATTEMPTS) && (
							<AnimatedView
								style={styles.attempts}
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
								{isLastAttempt ? (
									<Text02S style={styles.attemptsRemaining} color="brand">
										Last attempt. Entering the wrong PIN again will reset your
										wallet.
									</Text02S>
								) : (
									<>
										<Text02S style={styles.attemptsRemaining} color="brand">
											{attemptsRemaining} attempts remaining.{' '}
										</Text02S>
										<Pressable
											onPress={(): void => {
												toggleView({
													view: 'forgotPIN',
													data: {
														isOpen: true,
													},
												});
											}}>
											<Text02S color="brand">Forgot your PIN?</Text02S>
										</Pressable>
									</>
								)}
							</AnimatedView>
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
												backgroundColor: pin[i] === undefined ? brand08 : brand,
											},
										]}
									/>
								))}
						</View>

						<NumberPad
							style={styles.numberpad}
							type="simple"
							onPress={handleOnPress}
							onRemove={handleOnRemove}
						/>
					</AnimatedView>
				)}
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
	title: {
		textAlign: 'center',
		marginBottom: 32,
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
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 16,
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
		maxHeight: 350,
	},
});

export default memo(PinPad);
