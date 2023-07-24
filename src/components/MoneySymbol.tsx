import React, { ReactElement } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';

import { Display } from '../styles/text';
import { BIcon, LightningIcon } from '../styles/icons';
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
					style={styles.fiatSymbol}
					color="white5"
					testID="MoneyFiatSymbol">
					{fiatSymbol}
				</Display>
			)}
			{unit === EUnit.satoshi && (
				<LightningIcon
					color="white5"
					height={40}
					width={28}
					testID="MoneyLightningSymbol"
				/>
			)}
			{unit === EUnit.BTC && (
				<BIcon
					color="white5"
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
	fiatSymbol: {
		fontSize: 46,
		lineHeight: 55,
	},
});

export default MoneySymbol;
