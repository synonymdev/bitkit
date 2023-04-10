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
import { useTranslation } from 'react-i18next';

import { View as ThemedView, AnimatedView } from '../../../styles/components';
import { Text01S, Text02S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import useColors from '../../../hooks/colors';
import { getKeychainValue, vibrate } from '../../../utils/helpers';
import { showBottomSheet } from '../../../store/actions/ui';
import type { SettingsScreenProps } from '../../../navigation/types';

const ChangePin = ({
	navigation,
}: SettingsScreenProps<'ChangePin'>): ReactElement => {
	const { t } = useTranslation('security');
	const [pin, setPin] = useState<string>('');
	const [wrongPin, setWrongPin] = useState(false);
	const { brand, brand08 } = useColors();

	const handleOnPress = (n: string | number): void => {
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
				vibrate();
				setPin('');
				return;
			}

			// incorrect pin
			if (pin !== realPIN?.data) {
				vibrate();
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
		<ThemedView style={styles.container} testID="ChangePIN">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('cp_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			<View style={styles.text}>
				<Text01S color="gray1">{t('cp_text')}</Text01S>
			</View>

			<View style={styles.wrongPin}>
				{wrongPin ? (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						<Pressable
							onPress={(): void => {
								showBottomSheet('forgotPIN');
							}}>
							<Text02S color="brand">{t('cp_forgot')}</Text02S>
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
