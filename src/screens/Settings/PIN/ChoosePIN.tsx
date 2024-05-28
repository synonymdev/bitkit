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

import { BodyM, BodyS } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import NumberPad from '../../../components/NumberPad';
import useColors from '../../../hooks/colors';
import { vibrate } from '../../../utils/helpers';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { addPin } from '../../../utils/settings';
import { hideTodo } from '../../../store/slices/todos';
import { pinTodo } from '../../../store/shapes/todos';
import type { PinScreenProps } from '../../../navigation/types';
import { useAppDispatch } from '../../../hooks/redux';

const ChoosePIN = ({
	navigation,
	route,
}: PinScreenProps<'ChoosePIN'>): ReactElement => {
	const origPIN = route.params?.pin;
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const [pin, setPin] = useState<string>('');
	const [tryAgain, setTryAgain] = useState<boolean>(false);
	const { brand, brand08 } = useColors();

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
				dispatch(hideTodo(pinTodo.id));
				// replace the navigation stack to avoid going back to the PIN screen
				navigation.reset({
					index: 0,
					routes: [{ name: 'AskForBiometrics' }],
				});
			} else {
				vibrate({ type: 'notificationWarning' });
				setPin('');
				setTryAgain(true);
			}
		}, 500);

		return (): void => clearTimeout(timer);
	}, [pin, origPIN, navigation, dispatch]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t(origPIN ? 'pin_retype_header' : 'pin_choose_header')}
			/>

			<BodyM style={styles.text} color="secondary">
				{t(origPIN ? 'pin_retype_text' : 'pin_choose_text')}
			</BodyM>

			<View style={styles.tryAgain}>
				{tryAgain ? (
					<BodyS color="brand" testID="WrongPIN">
						{t('pin_not_match')}
					</BodyS>
				) : (
					<BodyS> </BodyS>
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
		backgroundColor: 'black',
		maxHeight: 350,
	},
});

export default memo(ChoosePIN);
