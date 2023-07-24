import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { Pressable } from '../styles/components';
import Money from '../components/Money';

/**
 * Displays the total amount of sats specified and it's corresponding fiat value.
 */
const AmountToggle = ({
	sats,
	secondaryFont = 'caption13Up',
	space = 0, // space between the rows
	reverse = false,
	disable = false,
	decimalLength = 'long',
	children,
	style,
	onPress,
	testID,
}: {
	sats: number;
	secondaryFont?: 'text01m' | 'caption13Up';
	reverse?: boolean;
	space?: number;
	disable?: boolean;
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	children?: ReactElement;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	const components = useMemo(() => {
		const arr = [
			<Money
				key="primary"
				sats={sats}
				decimalLength={decimalLength}
				unitType="primary"
				symbol={true}
			/>,
			<View key="space" style={{ height: space }} />,
			<Money
				key="secondary"
				sats={sats}
				size={secondaryFont}
				color="gray1"
				decimalLength={decimalLength}
				unitType="secondary"
				symbol={true}
			/>,
		];

		return reverse ? arr.reverse() : arr;
	}, [sats, reverse, space, decimalLength, secondaryFont]);

	const _onPress = useCallback((): void => {
		if (!disable && onPress) {
			onPress();
		}
	}, [disable, onPress]);

	return (
		<Pressable
			style={style}
			color="transparent"
			testID={testID}
			onPress={_onPress}>
			{components}
			{children}
		</Pressable>
	);
};

export default memo(AmountToggle);
