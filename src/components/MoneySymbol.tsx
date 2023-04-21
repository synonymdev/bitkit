import React, { ReactElement } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';

import { Display } from '../styles/text';
import { BIcon, LightningIcon } from '../styles/icons';
import { EBalanceUnit } from '../store/types/wallet';
import { useCurrency } from '../hooks/displayValues';

const MoneySymbol = ({
	unit,
	style,
}: {
	unit: EBalanceUnit;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { fiatSymbol } = useCurrency();

	return (
		<View style={[styles.root, style]}>
			<View style={styles.inner}>
				{unit === EBalanceUnit.fiat && (
					<Display
						style={styles.fiatSymbol}
						color="white5"
						testID="MoneyFiatSymbol">
						{fiatSymbol}
					</Display>
				)}
				{unit === EBalanceUnit.satoshi && (
					<LightningIcon
						color="white5"
						height={40}
						width={28}
						testID="MoneyLightningSymbol"
					/>
				)}
				{unit === EBalanceUnit.BTC && (
					<BIcon
						color="white5"
						height={40}
						width={28}
						testID="MoneyBitcoinSymbol"
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		position: 'relative',
		width: 28,
	},
	inner: {
		position: 'absolute',
	},
	fiatSymbol: {
		fontSize: 46,
		lineHeight: 55,
	},
});

export default MoneySymbol;
