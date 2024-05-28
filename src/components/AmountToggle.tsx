import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Pressable } from '../styles/components';
import Money from '../components/Money';

/**
 * Displays the total amount of sats specified and it's corresponding fiat value.
 */
const AmountToggle = ({
	amount,
	decimalLength = 'long',
	style,
	testID,
	onPress,
}: {
	amount: number;
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	return (
		<Pressable
			style={style}
			color="transparent"
			testID={testID}
			onPress={onPress}>
			<Money
				style={styles.secondary}
				sats={amount}
				size="caption13Up"
				color="secondary"
				decimalLength={decimalLength}
				unitType="secondary"
				symbol={true}
			/>
			<Money
				sats={amount}
				decimalLength={decimalLength}
				unitType="primary"
				symbol={true}
			/>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	secondary: {
		marginBottom: 16,
	},
});

export default memo(AmountToggle);
