import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import NumberPad from '../../components/NumberPad';
import NumberPadButtons from '../Wallets/NumberPadButtons';

const NumberPadWeeks = ({
	weeks,
	onChange,
	onDone,
	style,
}: {
	weeks: number;
	onChange: (weeks: number) => void;
	onDone: () => void;
	style?: object | Array<object>;
}): ReactElement => {
	const onPress = (key): void => {
		let amount = Number(`${weeks}${key}`);
		// limit amount 12 weeks
		if (amount > 12) {
			amount = 12;
		}
		onChange(amount);
	};

	const onRemove = (): void => {
		let str = String(weeks);
		str = str.substr(0, str.length - 1);
		const amount = Number(str);
		onChange(amount);
	};

	const handleDone = (): void => {
		onChange(Math.max(weeks, 1));
		onDone();
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type="simple"
			onPress={onPress}
			onRemove={onRemove}>
			<NumberPadButtons
				color="purple"
				showUnitButton={false}
				onMaxPress={(): void => {
					onChange(12);
				}}
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
