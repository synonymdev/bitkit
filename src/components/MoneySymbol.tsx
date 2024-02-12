import React, { ReactElement } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';

import { Display } from '../styles/text';
import { BitcoinIcon } from '../styles/icons';
import { EUnit } from '../store/types/wallet';
import { useCurrency } from '../hooks/displayValues';

const MoneySymbol = ({
	unit,
	style,
}: {
	unit: EUnit;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { fiatSymbol } = useCurrency();

	return (
		<View style={[styles.root, style]}>
			{unit === EUnit.fiat && (
				<Display
					style={[styles.symbol, styles.fiatSymbol]}
					color="white50"
					testID="MoneyFiatSymbol">
					{fiatSymbol}
				</Display>
			)}
			{unit === EUnit.BTC && (
				<BitcoinIcon
					style={styles.symbol}
					color="white50"
					height={40}
					width={28}
					testID="MoneyBitcoinSymbol"
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
		position: 'relative',
	},
	symbol: {
		marginRight: 4,
	},
	fiatSymbol: {
		fontSize: 46,
		lineHeight: 55,
	},
});

export default MoneySymbol;
