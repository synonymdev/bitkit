import React, {
	useState,
	useEffect,
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { StyleSheet, LayoutAnimation } from 'react-native';
import { systemWeights } from 'react-native-typography';

import { TouchableOpacity, View } from '../styles/components';
import { Text } from '../styles/text';
import { EvilIcon } from '../styles/icons';
import { updateSettings, wipeApp } from '../store/actions/settings';
import NavigationHeader from './NavigationHeader';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Store from '../store/types';

const {
	setKeychainValue,
	getKeychainValue,
	vibrate,
	shuffleArray,
} = require('../utils/helpers');

const ACTIVE_OPACITY = 0.2;

const makeDots = (num: number): string => {
	let ret = '';
	while (num > 0) {
		ret += ' ○ ';
		num--;
	}
	return ret;
};

interface PinComponent {
	onSuccess: () => void;
	onFailure?: () => void;
	pinSetup?: boolean; //true pushes the user through the pin setup process.
	style?: object;
	children?: ReactElement;
	route?: RouteProp<
		{ params: { pinSetup: boolean; navigateBackOnSuccess: boolean } },
		'params'
	>;
}

const PinPadButton = memo(
	({ num, onPress }: { num: number; onPress: () => void }): ReactElement => {
		return (
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={ACTIVE_OPACITY}
				style={styles.buttonContainer}
				color={'surface'}>
				<Text style={styles.button}>{num}</Text>
			</TouchableOpacity>
		);
	},
);

const PinPad = ({
	onSuccess = (): null => null,
	onFailure = (): null => null,
	pinSetup = false,
	style = {},
	children = <></>,
	route,
}: PinComponent): ReactElement => {
	const navigation = useNavigation();
	try {
		if (route?.params?.pinSetup) {
			pinSetup = route.params.pinSetup;
		}
	} catch {}

	let _digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	_digits = shuffleArray(_digits);
	const [digits, setDigits] = useState(_digits);
	const [value, setValue] = useState('');
	const [tmpPin, setTmpPin] = useState('');
	const [pinSetupStep, setPinSetupStep] = useState(1);
	const [invalidPin, setInvalidPin] = useState(false);
	const [attemptsRemaining, setAttemptsRemaining] = useState(0);
	const pinIsEnabled = useSelector((state: Store) => state.settings.pin);

	useEffect(() => {
		if (pinSetup) {
			//Allow enough time to transition to PinPad view
			setTimeout(() => {
				if (pinIsEnabled) {
					updateSettings({ pin: false });
				}
			}, 500);
		}

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => LayoutAnimation.easeInEaseOut());

	const _wipeApp = async (): Promise<void> => {
		await onFailure();
		await wipeApp({});
	};

	const handleClear = (_vibrate = true): void => {
		if (_vibrate) {
			vibrate({});
		}
		setValue('');
	};

	const handleRemove = (): void => {
		vibrate({});
		setValue(value.substr(0, value.length - 1));
	};

	//Handle pin button press.
	const handlePress = (num: number): void => {
		vibrate({});
		let _value = value;
		_value += String(num);
		setValue(_value);
	};

	//Reduce the amount of pin attempts remaining.
	const reducePinAttemptsRemaining = async (num = 1): Promise<void> => {
		const _attemptsRemaining = attemptsRemaining - num;
		await setKeychainValue({
			key: 'pinAttemptsRemaining',
			value: `${_attemptsRemaining}`,
		});
		setAttemptsRemaining(_attemptsRemaining);
	};

	const attemptToSignInWithPin = async (): Promise<void> => {
		try {
			const pin = await getKeychainValue({ key: 'pin' });
			//If Invalid Pin
			if (!pin.error && value !== pin?.data) {
				if (attemptsRemaining <= 1) {
					//Wipe device. Too many attempts
					console.log(
						'Pin attempt threshold breached. Wiping device. Hope you made a backup, friend.',
					);
					vibrate({ type: 'default' });
					await _wipeApp();
				} else {
					await reducePinAttemptsRemaining();
				}

				handleClear();
				return;
			}

			if (pin.error && !pin?.data) {
				await reducePinAttemptsRemaining();
				handleClear();
				return;
			}

			//If Valid Pin
			if (!pin.error && value === pin?.data) {
				await setKeychainValue({ key: 'pinAttemptsRemaining', value: '5' });
				handleClear(false);
				_onSuccess();
			}
		} catch (e) {
			console.log(e);
		}
	};

	//Handle successful login.
	const _onSuccess = (): void => {
		onSuccess();
		if (route?.params?.navigateBackOnSuccess) {
			navigation.goBack();
		}
	};

	const setupPin = async (): Promise<void> => {
		try {
			if (pinSetup && pinSetupStep === 1) {
				if (value.length < 1) {
					return;
				}
				setTmpPin(value);
				//Randomize The Digits & Clear The Value
				const newDigits = shuffleArray(digits);
				await Promise.all([
					setDigits(newDigits),
					setPinSetupStep(2),
					setValue(''),
					setInvalidPin(false),
				]);
				return;
			}

			if (pinSetup && pinSetupStep === 2) {
				if (value === tmpPin) {
					await setKeychainValue({ key: 'pin', value });
					await updateSettings({ pin: true });
					_onSuccess();
					return;
				} else {
					//Invalid Pin (Try Again)
					vibrate({ type: 'notificationWarning' });
					//Randomize The Digits
					const newDigits = shuffleArray(digits);
					await setTmpPin('');
					await Promise.all([
						setDigits(newDigits),
						setPinSetupStep(1),
						setValue(''),
						setInvalidPin(true),
					]);
				}
			}
		} catch (e) {}
	};

	const handleSubmit = (): void => {
		if (value.length < 1) {
			return;
		}
		vibrate({});
		if (pinSetup) {
			setupPin();
		} else {
			attemptToSignInWithPin();
		}
	};

	const dots = useMemo(() => makeDots(4 - value.length), [value]);
	const marks = useMemo(() => value.replace(/./g, ' ● '), [value]);

	const getDots = useCallback((): string => {
		try {
			if (value.length > 4) {
				return ` ● ● ● ●  +${value.length - 4}`;
			} else {
				return `${marks}${dots}`;
			}
		} catch (e) {
			return makeDots(4);
		}
	}, [dots, marks, value.length]);

	const getHeaderText = useCallback((): ReactElement => {
		try {
			if (pinSetup) {
				if (pinSetupStep === 1) {
					return (
						<View style={styles.centerItems}>
							{invalidPin && (
								<Text style={styles.text}>Pins Did Not Match</Text>
							)}
							<Text style={styles.pinHeaderText}>Please Enter Your Pin</Text>
						</View>
					);
				} else {
					return (
						<View style={styles.centerItems}>
							<Text style={styles.pinHeaderText}>Please Re-Enter Your Pin</Text>
						</View>
					);
				}
			}
			return (
				<View style={styles.centerItems}>
					<Text style={styles.header}>Enter pin:</Text>
					<Text style={styles.text}>
						{`Attempts Remaining: ${attemptsRemaining}`}
					</Text>
				</View>
			);
		} catch {
			return <></>;
		}
	}, [pinSetup, pinSetupStep, attemptsRemaining, invalidPin]);

	return (
		<View color={'background'} style={[styles.container, style]}>
			<NavigationHeader title="Pin Authentication" />
			<View style={styles.wideRow}>{getHeaderText()}</View>

			<View style={styles.wideRow}>
				<Text style={styles.dots}>{getDots()}</Text>
			</View>

			<View style={styles.row}>
				<PinPadButton
					onPress={(): void => handlePress(digits[0])}
					num={digits[0]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[1])}
					num={digits[1]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[2])}
					num={digits[2]}
				/>
			</View>

			<View style={styles.row}>
				<PinPadButton
					onPress={(): void => handlePress(digits[3])}
					num={digits[3]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[4])}
					num={digits[4]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[5])}
					num={digits[5]}
				/>
			</View>

			<View style={styles.row}>
				<PinPadButton
					onPress={(): void => handlePress(digits[6])}
					num={digits[6]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[7])}
					num={digits[7]}
				/>
				<PinPadButton
					onPress={(): void => handlePress(digits[8])}
					num={digits[8]}
				/>
			</View>

			<View style={styles.row}>
				<TouchableOpacity
					onPress={(): void => handleClear()}
					activeOpacity={ACTIVE_OPACITY}
					style={styles.buttonContainer}
					color={'surface'}>
					<Text style={styles.button}>C</Text>
				</TouchableOpacity>
				<PinPadButton
					onPress={(): void => handlePress(digits[9])}
					num={digits[9]}
				/>
				<TouchableOpacity
					onPress={handleRemove}
					activeOpacity={ACTIVE_OPACITY}
					style={styles.buttonContainer}
					color={'surface'}>
					<EvilIcon name={'chevron-left'} size={55} />
				</TouchableOpacity>
			</View>

			<View style={styles.wideRow}>
				<TouchableOpacity
					onPress={handleSubmit}
					activeOpacity={ACTIVE_OPACITY}
					style={styles.submitButton}
					color={'surface'}>
					<Text style={styles.text}>Submit</Text>
				</TouchableOpacity>
			</View>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingBottom: 40,
		zIndex: 300,
	},
	centerItems: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	header: {
		...systemWeights.light,
		fontSize: 35,
	},
	text: {
		...systemWeights.regular,
		fontSize: 18,
		textAlign: 'center',
		marginHorizontal: 20,
	},
	pinHeaderText: {
		...systemWeights.regular,
		fontSize: 24,
		textAlign: 'center',
		marginHorizontal: 20,
	},
	dots: {
		...systemWeights.bold,
		fontSize: 25,
	},
	buttonContainer: {
		width: 65,
		height: 65,
		marginHorizontal: 25,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		shadowColor: 'rgba(0, 0, 0, 0.2)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 8 },
		borderWidth: 0,
	},
	submitButton: {
		borderRadius: 10,
		paddingVertical: 15,
		paddingHorizontal: 15,
		shadowColor: 'rgba(0, 0, 0, 0.2)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 8 },
	},
	button: {
		...systemWeights.regular,
		fontSize: 25,
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
		opacity: 1,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 10,
	},
	wideRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 10,
		marginHorizontal: 20,
	},
});

export default memo(PinPad, () => true);
