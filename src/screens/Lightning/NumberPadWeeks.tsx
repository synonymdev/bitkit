import React, { ReactElement, useState } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';

import NumberPad from '../../components/NumberPad';
import { vibrate } from '../../utils/helpers';
import { handleNumberPadPress } from '../../utils/numberpad';
import NumberPadButtons from '../Wallets/NumberPadButtons';

const MAX_WEEKS = 12;

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
	const [errorKey, setErrorKey] = useState<string>();

	const onPress = (key: string): void => {
		const current = weeks.toString();
		const newAmount = handleNumberPadPress(key, current, { maxLength: 2 });

		if (Number(newAmount) > MAX_WEEKS) {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
			return;
		}

		onChange(Number(newAmount));
	};

	const handleDone = (): void => {
		onChange(Math.max(weeks, 1));
		onDone();
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type="simple"
			errorKey={errorKey}
			onPress={onPress}>
			<NumberPadButtons
				color="purple"
				showUnitButton={false}
				onMaxPress={(): void => onChange(MAX_WEEKS)}
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
