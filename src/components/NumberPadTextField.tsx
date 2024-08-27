import React, { memo, ReactElement } from 'react';
import { useAppSelector } from '../hooks/redux';
import {
	Pressable,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

import { Display } from '../styles/text';
import Money from './Money';
import { EDenomination, EUnit } from '../store/types/wallet';
import {
	conversionUnitSelector,
	denominationSelector,
	unitSelector,
} from '../store/reselect/settings';
import { convertToSats } from '../utils/conversion';
import { useCurrency } from '../hooks/displayValues';
import {
	getDisplayValues,
	getFiatDisplayValuesForFiat,
} from '../utils/displayValues';

const NumberPadTextField = ({
	value,
	showPlaceholder = true,
	showConversion = true,
	reverse = false,
	style,
	testID,
	onPress,
}: {
	value: string;
	showPlaceholder?: boolean;
	showConversion?: boolean;
	reverse?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	const { fiatSymbol } = useCurrency();
	const unit = useAppSelector(unitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const satoshis = convertToSats(value, conversionUnit);

	let placeholder = '0';
	let placeholderFractional = '';

	if (denomination === EDenomination.classic) {
		placeholderFractional = '00000000';
	}
	if (unit === EUnit.fiat) {
		placeholderFractional = '00';
	}
	if (placeholderFractional !== '') {
		placeholder = `0.${placeholderFractional}`;
	}

	if (value) {
		const [integer, fractional] = value.split('.');

		if (unit === EUnit.fiat) {
			const { fiatWhole } = getFiatDisplayValuesForFiat({
				value: Number(integer),
			});
			value = value.replace(integer, fiatWhole);
		}

		if (value.includes('.')) {
			placeholder = placeholder.substring(2 + fractional?.length);

			// truncate to 2 decimals for fiat
			if (unit === EUnit.fiat) {
				const { fiatWhole } = getFiatDisplayValuesForFiat({
					value: Number(integer),
				});

				value = `${fiatWhole}.${fractional.substring(0, 2)}`;
			}
		} else {
			if (denomination === EDenomination.modern && unit === EUnit.BTC) {
				const displayValue = getDisplayValues({ satoshis: Number(value) });
				value = displayValue.bitcoinFormatted;

				placeholder = '';
			} else {
				placeholder = `.${placeholderFractional}`;
			}
		}
	}

	return (
		<Pressable style={style} testID={testID} onPress={onPress}>
			{showConversion && !reverse && (
				<Money
					style={styles.secondary}
					sats={satoshis}
					size="caption13Up"
					color="secondary"
					symbol={true}
					unitType="secondary"
				/>
			)}

			<View style={styles.primary}>
				<Display style={styles.symbol} color="secondary">
					{unit === EUnit.BTC ? '₿' : fiatSymbol}
				</Display>
				<Display>
					{value !== placeholder && value}
					<Display color={showPlaceholder ? 'secondary' : 'white'}>
						{placeholder}
					</Display>
				</Display>
			</View>

			{showConversion && reverse && (
				<Money
					sats={satoshis}
					size="bodyMSB"
					color="secondary"
					symbol={true}
					unitType="secondary"
				/>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	primary: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	secondary: {
		marginBottom: 16,
	},
	symbol: {
		fontFamily: 'InterTight-ExtraBold',
		marginRight: 6,
	},
});

export default memo(NumberPadTextField);
