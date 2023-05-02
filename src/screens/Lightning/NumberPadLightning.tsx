import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../components/NumberPad';
import GradientView from '../../components/GradientView';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import { EBalanceUnit } from '../../store/types/wallet';
import { balanceUnitSelector } from '../../store/reselect/settings';
import { handleNumberPadPress } from '../../utils/numberpad';
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
			<GradientView>
				<NumberPadButtons
					color="white"
					onMax={onMax}
					onChangeUnit={onChangeUnit}
					onDone={onDone}
				/>
			</GradientView>
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
