import React, { memo, ReactElement, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSelector } from '../hooks/redux';

import {
	Caption13M,
	Caption13Up,
	Display,
	Text01M,
	Text02M,
	Title,
} from '../styles/text';
import { BitcoinIcon } from '../styles/icons';
import { useDisplayValues } from '../hooks/displayValues';
import { abbreviateNumber } from '../utils/helpers';
import { EDenomination, EUnit } from '../store/types/wallet';
import { IColors } from '../styles/colors';
import {
	unitSelector,
	hideBalanceSelector,
	denominationSelector,
	nextUnitSelector,
} from '../store/reselect/settings';

interface IMoney {
	sats: number;
	unitType?: 'primary' | 'secondary'; // force primary or secondary unit. Can be overwritten by unit prop
	unit?: EUnit; // force value formatting
	highlight?: boolean; // gray out decimals in fiat
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	symbol?: boolean; // show symbol icon
	symbolColor?: keyof IColors;
	color?: keyof IColors;
	enableHide?: boolean; // if true and settings.hideBalance === true it will replace number with dots
	sign?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	size?:
		| 'display'
		| 'text01m'
		| 'text02m'
		| 'caption13M'
		| 'caption13Up'
		| 'title';
}

const Money = (props: IMoney): ReactElement => {
	const primaryUnit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const hideBalance = useAppSelector(hideBalanceSelector);

	const sats = Math.abs(props.sats);
	const highlight = props.highlight ?? false;
	const decimalLength = props.decimalLength ?? 'long';
	const size = props.size ?? 'display';
	const unit =
		props.unit ?? (props.unitType === 'secondary' ? nextUnit : primaryUnit);
	const showSymbol = props.symbol ?? (unit === 'fiat' ? true : false);
	const color = props.color;
	const symbolColor = props.symbolColor;
	const hide = (props.enableHide ?? false) && hideBalance;
	const sign = props.sign;
	const testID = props.testID;

	const dv = useDisplayValues(sats);

	const [Text, lineHeight, iconHeight, iconWidth, iconMargin] = useMemo(() => {
		switch (size) {
			case 'caption13M':
				return [Caption13Up, undefined, 16, 8, 3];
			case 'caption13Up':
				return [Caption13M, undefined, 16, 8, 4];
			case 'text01m':
				return [Text01M, undefined, 16, 10, 4];
			case 'text02m':
				return [Text02M, undefined, 18, 9, 4];
			case 'title':
				return [Title, undefined, 26, 12, 6];
			default:
				// Override lineHeight for Display font
				return [Display, '57px', 43, 27, 10];
		}
	}, [size]);

	const symbol = useMemo(() => {
		switch (unit) {
			case EUnit.fiat:
				return (
					<Text
						style={{ marginRight: iconMargin }}
						lineHeight={lineHeight}
						color={symbolColor ?? color ?? 'white50'}
						testID="MoneyFiatSymbol">
						{dv.fiatSymbol}
					</Text>
				);
			default:
				return (
					<BitcoinIcon
						style={{ marginRight: iconMargin }}
						color={symbolColor ?? color ?? 'white50'}
						height={iconHeight}
						width={iconWidth}
						testID="MoneyBitcoinSymbol"
					/>
				);
		}
	}, [
		unit,
		Text,
		lineHeight,
		color,
		symbolColor,
		dv.fiatSymbol,
		iconHeight,
		iconWidth,
		iconMargin,
	]);

	let [prim = '', secd = ''] = useMemo(() => {
		switch (unit) {
			case EUnit.fiat: {
				if (dv.fiatWhole.length > 12) {
					const { newValue, abbreviation } = abbreviateNumber(dv.fiatWhole);
					return highlight
						? [newValue, abbreviation]
						: [newValue + abbreviation];
				}
				return highlight
					? [dv.fiatWhole, dv.fiatDecimalSymbol + dv.fiatDecimal]
					: [dv.fiatFormatted];
			}
			case EUnit.BTC: {
				if (denomination === EDenomination.classic) {
					if (decimalLength === 'long') {
						return [Number(dv.bitcoinFormatted).toFixed(8)];
					}

					return [Number(dv.bitcoinFormatted).toFixed(5)];
				}

				return [dv.bitcoinFormatted];
			}
		}
	}, [highlight, dv, unit, denomination, decimalLength]);

	if (hide) {
		if (size === 'display') {
			prim = ' • • • • • • • • •';
		} else {
			prim = ' • • • • •';
		}

		secd = '';
	}

	return (
		<View style={[styles.root, props.style]} testID={testID}>
			{sign && (
				<Text
					style={styles.sign}
					lineHeight={lineHeight}
					color={color ?? 'white50'}
					testID="MoneySign">
					{sign}
				</Text>
			)}
			{showSymbol && symbol}
			<Text lineHeight={lineHeight} color={color} testID="MoneyPrimary">
				{prim}
			</Text>
			{secd !== '' && (
				<Text lineHeight={lineHeight} color="white50" testID="MoneySecondary">
					{secd}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sign: {
		marginRight: 3,
	},
});

export default memo(Money);
