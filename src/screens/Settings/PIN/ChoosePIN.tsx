import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Text01S, Text02S } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import NumberPad from '../../../components/NumberPad';
import useColors from '../../../hooks/colors';
import { vibrate } from '../../../utils/helpers';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { addPin } from '../../../utils/settings';
import type { PinScreenProps } from '../../../navigation/types';

const ChoosePIN = ({
	navigation,
	route,
}: PinScreenProps<'ChoosePIN'>): ReactElement => {
	const origPIN = route.params?.pin;
	const [pin, setPin] = useState<string>('');
	const [tryAgain, setTryAgain] = useState<boolean>(false);
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

	useBottomSheetBackPress('PINNavigation');

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (pin.length !== 4) {
				return;
			}
			if (!origPIN) {
				navigation.push('ChoosePIN', { pin });
				return;
			}
			const pinsAreEqual = pin === origPIN;
			if (pinsAreEqual) {
				addPin(pin);
				navigation.navigate('AskForBiometrics');
			} else {
				vibrate({ type: 'notificationWarning' });
				setPin('');
				setTryAgain(true);
			}
		}, 500);

		return (): void => clearInterval(timer);
	}, [pin, origPIN, navigation]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={origPIN ? 'Retype 4-Digit PIN' : 'Choose 4-Digit PIN'}
				displayBackButton={origPIN ? true : false}
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

			<View style={styles.tryAgain}>
				{tryAgain ? (
					<Text02S color="brand">Try again, this is not the same PIN.</Text02S>
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
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
	},
	tryAgain: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
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
		maxHeight: 350,
	},
});

export default memo(ChoosePIN);
