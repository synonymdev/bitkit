import React, { memo, ReactElement } from 'react';
import { useAppSelector } from '../hooks/redux';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { DisplayT } from '../styles/text';
import { EDenomination, EUnit } from '../store/types/wallet';
import { denominationSelector, unitSelector } from '../store/reselect/settings';
import {
	getDisplayValues,
	getFiatDisplayValuesForFiat,
} from '../utils/displayValues';
import { useCurrency } from '../hooks/displayValues';

const NumberPadTextField = ({
	value,
	showPlaceholder = true,
	style,
	testID,
	onPress,
}: {
	value: string;
	showPlaceholder?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	const { fiatSymbol } = useCurrency();
	const unit = useAppSelector(unitSelector);
	const denomination = useAppSelector(denominationSelector);

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
		<Pressable style={[styles.root, style]} testID={testID} onPress={onPress}>
			<DisplayT style={styles.symbol} color="secondary">
				{unit === EUnit.BTC ? '₿' : fiatSymbol}
			</DisplayT>
			<DisplayT>
				{value !== placeholder && value}
				<DisplayT color={showPlaceholder ? 'secondary' : 'white'}>
					{placeholder}
				</DisplayT>
			</DisplayT>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	symbol: {
		marginRight: 6,
	},
});

export default memo(NumberPadTextField);
