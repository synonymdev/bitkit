import React, { ReactElement } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

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
		<View style={style}>
			{unit === EBalanceUnit.fiat && (
				<Display color="white5" testID="MoneyFiatSymbol">
					{fiatSymbol}
				</Display>
			)}
			{unit === EBalanceUnit.satoshi && (
				<LightningIcon
					color="white5"
					height={36}
					width={24}
					testID="MoneyLightningSymbol"
				/>
			)}
			{unit === EBalanceUnit.BTC && (
				<BIcon
					color="white5"
					height={39}
					width={25}
					testID="MoneyBitcoinSymbol"
				/>
			)}
		</View>
	);
};

export default MoneySymbol;
