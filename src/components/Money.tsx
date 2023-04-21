import React, { memo, ReactElement, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import {
	Caption13M,
	Display,
	Headline,
	Text01M,
	Text01S,
	Text02M,
	Text02S,
	Title,
} from '../styles/text';
import { BIcon, LightningIcon } from '../styles/icons';
import useDisplayValues from '../hooks/displayValues';
import { abbreviateNumber } from '../utils/helpers';
import { EBalanceUnit, EBitcoinUnit } from '../store/types/wallet';
import { IColors } from '../styles/colors';
import {
	bitcoinUnitSelector,
	hideBalanceSelector,
} from '../store/reselect/settings';

interface IMoney {
	sats: number;
	showFiat?: boolean; // if true shows value in fiat, if false shows value in settings.bitcoinUnit. Can be overwritten by unit prop
	unit?: EBalanceUnit | EBitcoinUnit; // force value formatting
	highlight?: boolean; // grey out decimals in fiat
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	symbol?: boolean; // show symbol icon
	color?: keyof IColors;
	enableHide?: boolean; // if true and settings.hideBalance === true it will replace number with dots
	sign?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	size?:
		| 'display'
		| 'text01s'
		| 'text01m'
		| 'text02s'
		| 'text02m'
		| 'caption13M'
		| 'title'
		| 'headline';
}

const Money = (props: IMoney): ReactElement => {
	const bitcoinUnit = useSelector(bitcoinUnitSelector);
	const hideBalance = useSelector(hideBalanceSelector);

	const sats = Math.abs(props.sats);
	const highlight = props.highlight ?? false;
	const decimalLength = props.decimalLength ?? 'short';
	const size = props.size ?? 'display';
	const showFiat = props.showFiat ?? false;
	const unit = props.unit ?? (showFiat ? EBalanceUnit.fiat : bitcoinUnit);
	const showSymbol = props.symbol ?? (unit === 'fiat' ? true : false);
	const color = props.color;
	const hide = (props.enableHide ?? false) && hideBalance;
	const sign = props.sign;
	const testID = props.testID;

	const dv = useDisplayValues(
		sats,
		unit === EBalanceUnit.fiat ? EBitcoinUnit.BTC : (unit as EBitcoinUnit),
	);

	const [Text, lineHeight, iconHeight, iconWidth] = useMemo(() => {
		switch (size) {
			case 'headline':
				// Override lineHeight for Display font
				return [Headline, '41px', 40, 20];
			case 'title':
				return [Title, undefined, 26, 12];
			case 'text01s':
				return [Text01S, undefined, 21, 10];
			case 'text01m':
				return [Text01M, undefined, 21, 10];
			case 'text02s':
				return [Text02S, undefined, 18, 9];
			case 'text02m':
				return [Text02M, undefined, 18, 9];
			case 'caption13M':
				return [Caption13M, undefined, 16, 8];
			default:
				// Override lineHeight for Display font
				return [Display, '57px', 39, 25];
		}
	}, [size]);

	const symbol = useMemo(() => {
		switch (unit) {
			case 'fiat':
				return (
					<Text
						style={styles.symbol}
						lineHeight={lineHeight}
						color={color ?? 'white5'}
						testID="MoneyFiatSymbol">
						{dv.fiatSymbol}
					</Text>
				);
			case 'satoshi':
				return (
					<LightningIcon
						style={styles.symbol}
						color={color ?? 'white5'}
						height={iconHeight}
						width={iconWidth}
						testID="MoneyLightningSymbol"
					/>
				);
			default:
				return (
					<BIcon
						style={styles.symbol}
						color={color ?? 'white5'}
						height={iconHeight}
						width={iconWidth}
						testID="MoneyBitcoinSymbol"
					/>
				);
		}
	}, [unit, Text, lineHeight, color, dv.fiatSymbol, iconHeight, iconWidth]);

	let [prim = '', secd = ''] = useMemo(() => {
		switch (unit) {
			case EBalanceUnit.fiat:
				if (dv.fiatWhole.length > 12) {
					const { newValue, abbreviation } = abbreviateNumber(dv.fiatWhole);
					return highlight
						? [newValue, abbreviation]
						: [newValue + abbreviation];
				}
				return highlight
					? [dv.fiatWhole, dv.fiatDecimalSymbol + dv.fiatDecimal]
					: [dv.fiatFormatted];
			case EBalanceUnit.BTC: {
				if (decimalLength === 'long') {
					return [Number(dv.bitcoinFormatted).toFixed(8)];
				}

				return [Number(dv.bitcoinFormatted).toFixed(5)];
			}
			default: {
				return [dv.bitcoinFormatted];
			}
		}
	}, [highlight, dv, unit, decimalLength]);

	if (hide) {
		if (size === 'display') {
			prim = ' • • • • • • • • • •';
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
					color={color ?? 'white5'}
					testID="MoneySign">
					{sign}
				</Text>
			)}
			{showSymbol && symbol}
			<Text lineHeight={lineHeight} color={color} testID="MoneyPrimary">
				{prim}
			</Text>
			{secd !== '' && (
				<Text lineHeight={lineHeight} color="white5" testID="MoneySecondary">
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
	symbol: {
		marginRight: 4,
	},
});

export default memo(Money);
