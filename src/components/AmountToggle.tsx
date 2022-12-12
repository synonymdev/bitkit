import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { LayoutAnimation, StyleProp, View, ViewStyle } from 'react-native';

import { Pressable } from '../styles/components';
import Store from '../store/types';
import Money from '../components/Money';

/**
 * Displays the total amount of sats specified and it's corresponding fiat value.
 */
const AmountToggle = ({
	sats,
	unit,
	space = 0, // space between the rows
	reverse = false,
	disable = false,
	children,
	style,
	onPress,
}: {
	sats: number;
	unit?: 'asset' | 'fiat';
	reverse?: boolean;
	space?: number;
	disable?: boolean;
	children?: ReactElement;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
}): ReactElement => {
	const unitPreference = useSelector(
		(state: Store) => state.settings.unitPreference,
	);

	const primary = unit ?? unitPreference;

	const components = useMemo(() => {
		const btcProps = { symbol: true };
		const fiatProps = { showFiat: true };

		const arr = [
			<Money
				key="big"
				sats={sats}
				{...{ ...(primary === 'fiat' ? fiatProps : btcProps) }}
			/>,
			<View key="space" style={{ height: space }} />,
			<Money
				key="small"
				sats={sats}
				size="text01m"
				color="gray1"
				{...{ ...(primary === 'fiat' ? btcProps : fiatProps) }}
			/>,
		];

		return reverse ? arr.reverse() : arr;
	}, [primary, sats, reverse, space]);

	LayoutAnimation.easeInEaseOut();

	const _onPress = useCallback((): void => {
		if (!disable && onPress) {
			onPress();
		}
	}, [disable, onPress]);

	return (
		<Pressable onPress={_onPress} color="transparent" style={style}>
			{components}
			{children}
		</Pressable>
	);
};

export default memo(AmountToggle);
