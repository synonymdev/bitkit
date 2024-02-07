import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useAppSelector } from '../../hooks/redux';

import NumberPad from '../../components/NumberPad';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import {
	conversionUnitSelector,
	numberPadSelector,
} from '../../store/reselect/settings';
import { handleNumberPadPress } from '../../utils/numberpad';
import { convertToSats } from '../../utils/conversion';
import { vibrate } from '../../utils/helpers';

const NumberPadLightning = ({
	value,
	maxAmount,
	onChange,
	onMax,
	onChangeUnit,
	onDone,
	style,
}: {
	value: string;
	maxAmount: number;
	onChange: (value: string) => void;
	onMax: () => void;
	onChangeUnit: () => void;
	onDone: () => void;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const [errorKey, setErrorKey] = useState<string>();
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const { maxLength, maxDecimals, type } = useAppSelector(numberPadSelector);

	const onPress = (key: string): void => {
		const newValue = handleNumberPadPress(key, value, {
			maxLength,
			maxDecimals,
		});

		const amount = convertToSats(newValue, conversionUnit);

		if (amount <= maxAmount) {
			onChange(newValue);
		} else {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type={type}
			errorKey={errorKey}
			onPress={onPress}>
			<NumberPadButtons
				color="white"
				onMax={onMax}
				onChangeUnit={onChangeUnit}
				onDone={onDone}
			/>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 380,
		position: 'relative',
	},
});

export default memo(NumberPadLightning);
