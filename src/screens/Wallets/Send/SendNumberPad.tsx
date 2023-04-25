import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../../components/NumberPad';
import { vibrate } from '../../../utils/helpers';
import { EBalanceUnit } from '../../../store/types/wallet';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { convertToSats } from '../../../utils/exchange-rate';
import { balanceUnitSelector } from '../../../store/reselect/settings';

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
	const unit = useSelector(balanceUnitSelector);

	const maxDecimals = unit === EBalanceUnit.BTC ? 8 : 2;
	const maxLength = unit === EBalanceUnit.satoshi ? 10 : 20;
	const numberPadType = unit === EBalanceUnit.satoshi ? 'integer' : 'decimal';

	const onPress = (key: string): void => {
		const newValue = handleNumberPadPress(key, value, {
			maxLength,
			maxDecimals,
		});

		const amount = convertToSats(newValue, unit);

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
			type={numberPadType}
			errorKey={errorKey}
			onPress={onPress}
		/>
	);
};

export default memo(SendNumberPad);
