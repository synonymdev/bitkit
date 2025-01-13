import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import NumberPad from '../../../components/NumberPad';
import { useAppSelector } from '../../../hooks/redux';
import {
	conversionUnitSelector,
	numberPadSelector,
} from '../../../store/reselect/settings';
import { convertToSats } from '../../../utils/conversion';
import { vibrate } from '../../../utils/helpers';
import { handleNumberPadPress } from '../../../utils/numberpad';

const SendNumberPad = ({
	value,
	maxAmount,
	onChange,
	onError,
	style,
}: {
	value: string;
	maxAmount: number;
	onChange: (value: string) => void;
	onError: () => void;
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
			onError();
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return (
		<NumberPad
			style={style}
			type={type}
			errorKey={errorKey}
			onPress={onPress}
		/>
	);
};

export default memo(SendNumberPad);
