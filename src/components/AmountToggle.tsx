import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { LayoutAnimation, View } from 'react-native';

import { Pressable } from '../styles/components';
import Store from '../store/types';
import Money from '../components/Money';

/**
 * Displays the total amount of sats specified and it's corresponding fiat value.
 */
const AmountToggle = ({
	sats = 0,
	style,
	onPress,
	reverse = false,
	space = 0, // space between the rows
}: {
	sats: number;
	style?: object;
	onPress?: Function;
	reverse?: boolean;
	space?: number;
}): ReactElement => {
	const primary = useSelector((state: Store) => state.settings.unitPreference);

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

	return (
		<Pressable onPress={onPress} color="transparent" style={style}>
			{components}
		</Pressable>
	);
};

export default memo(AmountToggle);
