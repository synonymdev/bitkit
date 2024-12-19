import { useFocusEffect } from '@react-navigation/native';
import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import SafeAreaInset from '../../../components/SafeAreaInset';
import useColors from '../../../hooks/colors';
import type { SettingsScreenProps } from '../../../navigation/types';
import { AnimatedView, View as ThemedView } from '../../../styles/components';
import { BodyM, BodyS } from '../../../styles/text';
import { vibrate } from '../../../utils/helpers';
import { editPin } from '../../../utils/settings';

const ChangePin2 = ({
	navigation,
	route,
}: SettingsScreenProps<'ChangePin2'>): ReactElement => {
	const { t } = useTranslation('security');
	const origPIN = route.params?.pin;
	const [pin, setPin] = useState<string>('');
	const [wrongPin, setWrongPin] = useState<boolean>(false);
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

		return (): void => clearTimeout(timer);
	}, [pin, origPIN, navigation]);

	return (
		<ThemedView style={styles.container} testID="ChangePIN2">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t(origPIN ? 'cp_retype_title' : 'cp_setnew_title')}
			/>

			<BodyM style={styles.text} color="secondary">
				{t(origPIN ? 'cp_retype_text' : 'cp_setnew_text')}
			</BodyM>

			<View style={styles.wrongPin}>
				{wrongPin ? (
					<AnimatedView
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}
						testID="WrongPIN">
						<BodyS color="brand">{t('cp_try_again')}</BodyS>
					</AnimatedView>
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
