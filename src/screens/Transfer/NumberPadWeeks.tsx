import React, { ReactElement, useState } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

import NumberPad from '../../components/NumberPad';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import { vibrate } from '../../utils/helpers';
import { handleNumberPadPress } from '../../utils/numberpad';
import { useAppSelector } from '../../hooks/redux';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';

const NumberPadWeeks = ({
	weeks,
	onChange,
	onDone,
	style,
}: {
	weeks: number;
	onChange: (weeks: number) => void;
	onDone: () => void;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const [errorKey, setErrorKey] = useState<string>();

	const { minExpiryWeeks, maxExpiryWeeks } = blocktankInfo.options;

	const onPress = (key: string): void => {
		const current = weeks.toString();
		const newAmount = handleNumberPadPress(key, current, { maxLength: 2 });

		if (Number(newAmount) > maxExpiryWeeks) {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
			return;
		}

		onChange(Number(newAmount));
	};

	const handleDone = (): void => {
		onChange(Math.max(weeks, minExpiryWeeks));
		onDone();
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type="simple"
			errorKey={errorKey}
			onPress={onPress}>
			<NumberPadButtons
				color="white"
				onMax={(): void => onChange(maxExpiryWeeks)}
				onDone={handleDone}
			/>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 425,
	},
});

export default NumberPadWeeks;
