import React, { ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useCurrency } from '../hooks/displayValues';
import { EUnit } from '../store/types/wallet';
import { Display } from '../styles/text';

const Amount = ({
	value,
	unit = EUnit.BTC,
	style,
}: {
	value: number;
	unit?: EUnit;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { fiatSymbol } = useCurrency();
	return (
		<View style={[styles.row, style]}>
			<Display style={styles.symbol} color="secondary">
				{unit === EUnit.BTC ? '₿' : fiatSymbol}
			</Display>
			<Display color={value ? 'primary' : 'secondary'}>{value}</Display>
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	symbol: {
		fontFamily: 'InterTight-Bold',
		marginRight: 6,
	},
});

export default Amount;
