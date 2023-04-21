import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { LayoutAnimation, StyleProp, View, ViewStyle } from 'react-native';

import { Pressable } from '../styles/components';
import Money from '../components/Money';
import { balanceUnitSelector } from '../store/reselect/settings';
import { EBalanceUnit } from '../store/types/wallet';

/**
 * Displays the total amount of sats specified and it's corresponding fiat value.
 */
const AmountToggle = ({
	sats,
	unit,
	space = 0, // space between the rows
	reverse = false,
	disable = false,
	decimalLength = 'short',
	children,
	style,
	onPress,
	testID,
}: {
	sats: number;
	unit?: EBalanceUnit;
	reverse?: boolean;
	space?: number;
	disable?: boolean;
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	children?: ReactElement;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	const balanceUnit = useSelector(balanceUnitSelector);
	const primaryUnit = unit ?? balanceUnit;

	const components = useMemo(() => {
		const btcProps = { symbol: true };
		const fiatProps = { showFiat: true };

		const arr = [
			<Money
				key="primary"
				sats={sats}
				decimalLength={decimalLength}
				{...{ ...(primaryUnit === EBalanceUnit.fiat ? fiatProps : btcProps) }}
			/>,
			<View key="space" style={{ height: space }} />,
			<Money
				key="secondary"
				sats={sats}
				size="text01m"
				color="gray1"
				decimalLength={decimalLength}
				{...{ ...(primaryUnit === EBalanceUnit.fiat ? btcProps : fiatProps) }}
			/>,
		];

		return reverse ? arr.reverse() : arr;
	}, [primaryUnit, sats, reverse, space, decimalLength]);

	LayoutAnimation.easeInEaseOut();

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
