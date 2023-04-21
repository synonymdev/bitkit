import React, { memo, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import {
	Pressable,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

import { Display } from '../styles/text';
import Money from './Money';
import MoneySymbol from './MoneySymbol';
import { EBalanceUnit, EBitcoinUnit } from '../store/types/wallet';
import { balanceUnitSelector } from '../store/reselect/settings';
import {
	convertToSats,
	getDisplayValues,
	getFiatDisplayValuesForFiat,
} from '../utils/exchange-rate';

const NumberPadTextField = ({
	value,
	style,
	testID,
	onPress,
}: {
	value: string;
	space?: number;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	const unit = useSelector(balanceUnitSelector);

	let placeholder = '0';
	let placeholderFractional = '';

	if (unit === EBalanceUnit.BTC) {
		placeholderFractional = '00000000';
	}
	if (unit === EBalanceUnit.fiat) {
		placeholderFractional = '00';
	}
	if (placeholderFractional !== '') {
		placeholder = `0.${placeholderFractional}`;
	}

	const satoshis = convertToSats(value, unit);

	if (value) {
		const [integer, fractional] = value.split('.');

		if (unit === EBalanceUnit.fiat) {
			const { fiatWhole } = getFiatDisplayValuesForFiat({
				value: Number(integer),
			});
			value = value.replace(integer, fiatWhole);
		}

		if (value.includes('.')) {
			placeholder = placeholder.substring(2 + fractional?.length);

			// truncate to 2 decimals for fiat
			if (unit === EBalanceUnit.fiat) {
				const { fiatWhole } = getFiatDisplayValuesForFiat({
					value: Number(integer),
				});

				value = `${fiatWhole}.${fractional.substring(0, 2)}`;
			}
		} else {
			if (unit === EBalanceUnit.satoshi) {
				const displayValue = getDisplayValues({
					satoshis: Number(value),
					bitcoinUnit: EBitcoinUnit.satoshi,
				});
				value = displayValue.bitcoinFormatted;

				placeholder = '';
			} else {
				placeholder = `.${placeholderFractional}`;
			}
		}
	}

	const btcProps = { symbol: true };
	const fiatProps = { showFiat: true };

	return (
		<Pressable style={style} testID={testID} onPress={onPress}>
			<Money
				sats={satoshis}
				size="text01m"
				color="gray1"
				{...{ ...(unit === EBalanceUnit.fiat ? btcProps : fiatProps) }}
			/>
			<View style={styles.main}>
				<MoneySymbol style={styles.symbol} unit={unit} />
				{value !== placeholder && (
					<Display color="white" lineHeight="57px">
						{value}
					</Display>
				)}
				<Display color="gray1" lineHeight="57px">
					{placeholder}
				</Display>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	main: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 9,
	},
	symbol: {
		marginRight: 4,
	},
});

export default memo(NumberPadTextField);
