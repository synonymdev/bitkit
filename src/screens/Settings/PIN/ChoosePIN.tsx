import React, {
	memo,
	ReactElement,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Text01S, Text02S } from '../../../styles/text';
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
	const { t } = useTranslation('security');
	const origPIN = route.params?.pin;
	const [pin, setPin] = useState<string>('');
	const [tryAgain, setTryAgain] = useState<boolean>(false);
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
				title={t(origPIN ? 'pin_retype_header' : 'pin_choose_header')}
				displayBackButton={origPIN ? true : false}
			/>

			<Text01S style={styles.text} color="gray1">
				{t(origPIN ? 'pin_retype_text' : 'pin_choose_text')}
			</Text01S>

			<View style={styles.tryAgain}>
				{tryAgain ? (
					<Text02S color="brand" testID="WrongPIN">
						{t('pin_not_match')}
					</Text02S>
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
