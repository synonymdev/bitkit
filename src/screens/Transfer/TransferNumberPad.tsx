import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import NumberPad from '../../components/NumberPad';
import { useAppSelector } from '../../hooks/redux';
import {
	conversionUnitSelector,
	numberPadSelector,
} from '../../store/reselect/settings';
import { convertToSats } from '../../utils/conversion';
import { vibrate } from '../../utils/helpers';
import { handleNumberPadPress } from '../../utils/numberpad';

const TransferNumberPad = ({
	value,
	maxAmount,
	style,
	onChange,
	onError,
}: {
	value: string;
	maxAmount: number;
	style?: StyleProp<ViewStyle>;
	onChange: (value: string) => void;
	onError?: () => void;
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
			onError?.();
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type={type}
			errorKey={errorKey}
			onPress={onPress}
		/>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 380,
		position: 'relative',
	},
});

export default memo(TransferNumberPad);
