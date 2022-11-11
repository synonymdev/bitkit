import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
	View as ThemedView,
	Text01S,
	Text02S,
	AnimatedView,
} from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import useColors from '../../../hooks/colors';
import { vibrate } from '../../../utils/helpers';
import type { SettingsScreenProps } from '../../../navigation/types';
import { editPin } from '../../../utils/settings';
import { FadeIn, FadeOut } from 'react-native-reanimated';

const ChangePin2 = ({
	navigation,
	route,
}: SettingsScreenProps<'ChangePin2'>): ReactElement => {
	const origPIN = route.params?.pin;
	const [pin, setPin] = useState<string>('');
	const [wrongPin, setWrongPin] = useState<boolean>(false);
	const { brand, brand08 } = useColors();

	const handleOnPress = (n): void => {
		setPin((p) => {
			if (p.length === 4) {
				return p;
			}
			return p + String(n);
		});
	};

	const handleOnRemove = (): void => setPin((p) => p.slice(0, -1));

	// reset pin on back
	useFocusEffect(useCallback(() => setPin(''), []));

	// submit pin
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (pin.length !== 4) {
				return;
			}
			if (!origPIN) {
				navigation.push('ChangePin2', { pin });
				return;
			}
			const pinsAreEqual = pin === origPIN;
			if (pinsAreEqual) {
				editPin(pin);
				navigation.navigate('PinChanged');
			} else {
				vibrate({ type: 'notificationWarning' });
				setPin('');
				setWrongPin(true);
			}
		}, 500);

		return (): void => clearInterval(timer);
	}, [pin, origPIN, navigation]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={origPIN ? 'Retype New PIN' : 'Set New PIN'}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			{origPIN ? (
				<Text01S style={styles.text} color="gray1">
					Please retype your 4-digit PIN to complete the setup process.
				</Text01S>
			) : (
				<Text01S style={styles.text} color="gray1">
					Please use a PIN you will remember. If you forget your PIN you can
					reset it, but that will require restoring your wallet.
				</Text01S>
			)}

			<View style={styles.wrongPin}>
				{wrongPin ? (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Text02S color="brand">
							Try again, this is not the same PIN.
						</Text02S>
					</AnimatedView>
				) : (
					<Text02S> </Text02S>
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
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		alignSelf: 'flex-start',
		marginHorizontal: 16,
		marginBottom: 32,
	},
	wrongPin: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 16,
	},
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 'auto',
	},
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		marginHorizontal: 12,
		borderWidth: 1,
	},
	numberpad: {
		maxHeight: 350,
	},
});

export default memo(ChangePin2);
