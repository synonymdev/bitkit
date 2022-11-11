import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
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
import { getKeychainValue, vibrate } from '../../../utils/helpers';
import { toggleView } from '../../../store/actions/user';
import type { SettingsScreenProps } from '../../../navigation/types';

const ChangePin = ({
	navigation,
}: SettingsScreenProps<'ChangePin'>): ReactElement => {
	const [pin, setPin] = useState<string>('');
	const [wrongPin, setWrongPin] = useState(false);
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

			const realPIN = await getKeychainValue({ key: 'pin' });

			// error getting pin
			if (realPIN.error) {
				console.log('Error getting PIN: ', realPIN.error);
				vibrate({});
				setPin('');
				return;
			}

			// incorrect pin
			if (pin !== realPIN?.data) {
				vibrate({});
				setWrongPin(true);
				setPin('');
				return;
			}

			setPin('');
			navigation.navigate('ChangePin2');
		}, 500);

		return (): void => {
			clearInterval(timer);
		};
	}, [pin, navigation]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Change PIN"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			<View style={styles.text}>
				<Text01S color="gray1">
					You can change your PIN code to a new{'\n'}4-digit combination. Please
					enter your current PIN code first.
				</Text01S>
			</View>

			<View style={styles.wrongPin}>
				{wrongPin ? (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
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
		flexWrap: 'wrap',
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

export default memo(ChangePin);
