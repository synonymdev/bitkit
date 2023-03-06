import React, { memo, ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import NumberPad from '../../../components/NumberPad';

const FeeNumberPad = ({
	value,
	onChange,
	style,
}: {
	value: number;
	onChange: (value: number) => void;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const onPress = (key: string | number): void => {
		const newValue = `${value}${key}`;
		onChange(Number(newValue));
	};

	const onRemove = (): void => {
		const currentValue = `${value}`;
		let newValue = currentValue.substring(0, currentValue.length - 1);
		if (newValue.length === 0) {
			newValue = '0';
		}
		onChange(Number(newValue));
	};

	return (
		<NumberPad
			style={style}
			type="integer"
			onPress={onPress}
			onRemove={onRemove}
		/>
	);
};

export default memo(FeeNumberPad);
