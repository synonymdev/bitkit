import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../components/NumberPad';
import { handleNumberPadPress } from '../../utils/numberpad';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import { EBalanceUnit } from '../../store/types/wallet';
import { balanceUnitSelector } from '../../store/reselect/settings';
import { convertToSats } from '../../utils/exchange-rate';
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
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type={numberPadType}
			errorKey={errorKey}
			onPress={onPress}>
			<NumberPadButtons
				color="purple"
				onMax={onMax}
				onChangeUnit={onChangeUnit}
				onDone={onDone}
			/>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 425,
	},
});

export default memo(NumberPadLightning);
