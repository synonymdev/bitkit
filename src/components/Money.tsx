import React, { memo, ReactElement, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import {
	CaptionB,
	Caption13Up,
	Display,
	BodyMSB,
	BodySSB,
	Title,
} from '../styles/text';
import { IThemeColors } from '../styles/themes';
import { useAppSelector } from '../hooks/redux';
import { useDisplayValues } from '../hooks/displayValues';
import { abbreviateNumber } from '../utils/helpers';
import { EDenomination, EUnit } from '../store/types/wallet';
import {
	unitSelector,
	hideBalanceSelector,
	denominationSelector,
	nextUnitSelector,
} from '../store/reselect/settings';

type TSize =
	| 'display'
	| 'title'
	| 'bodyMSB'
	| 'bodySSB'
	| 'captionB'
	| 'caption13Up';

type MoneyProps = {
	sats: number;
	unitType?: 'primary' | 'secondary'; // force primary or secondary unit. Can be overwritten by unit prop
	unit?: EUnit; // force value formatting
	decimalLength?: 'long' | 'short'; // whether to show 5 or 8 decimals for BTC
	symbol?: boolean; // show symbol icon
	symbolColor?: keyof IThemeColors;
	color?: keyof IThemeColors;
	enableHide?: boolean; // if true and settings.hideBalance === true it will replace number with dots
	sign?: string;
	shouldRoundUp?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	size?: TSize;
};

const Money = (props: MoneyProps): ReactElement => {
	const primaryUnit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const hideBalance = useAppSelector(hideBalanceSelector);

	const sats = Math.abs(props.sats);
	const decimalLength = props.decimalLength ?? 'long';
	const size = props.size ?? 'display';
	const unit =
		props.unit ?? (props.unitType === 'secondary' ? nextUnit : primaryUnit);
	const showSymbol = props.symbol ?? (unit === 'fiat' ? true : false);
	const color = props.color;
	const symbolColor = props.symbolColor;
	const hide = (props.enableHide ?? false) && hideBalance;
	const sign = props.sign;
	const shouldRoundUp = props.shouldRoundUp ?? false;
	const testID = props.testID;

	const dv = useDisplayValues(sats, shouldRoundUp);

	const [Text, iconMargin] = useMemo(() => {
		switch (size) {
			case 'captionB':
				return [Caption13Up, 3];
			case 'caption13Up':
				return [CaptionB, 4];
			case 'bodyMSB':
				return [BodyMSB, 4];
			case 'bodySSB':
				return [BodySSB, 4];
			case 'title':
				return [Title, 6];
			default:
				return [Display, 6];
		}
	}, [size]);

	const symbol = useMemo(() => {
		const style = {
			marginRight: iconMargin,
			// cap symbol font weight to ExtraBold for display size
			...(size === 'display' ? { fontFamily: 'InterTight-ExtraBold' } : {}),
		};

		return (
			<Text
				style={style}
				color={symbolColor ?? color ?? 'secondary'}
				testID="MoneyFiatSymbol">
				{unit === EUnit.BTC ? '₿' : dv.fiatSymbol}
			</Text>
		);
	}, [Text, size, unit, color, symbolColor, dv.fiatSymbol, iconMargin]);

	let text = useMemo(() => {
		switch (unit) {
			case EUnit.fiat: {
				if (dv.fiatWhole.length > 12) {
					const { newValue, abbreviation } = abbreviateNumber(dv.fiatWhole);
					return `${newValue}${abbreviation}`;
				}

				return dv.fiatFormatted;
			}
			case EUnit.BTC: {
				if (denomination === EDenomination.classic) {
					if (decimalLength === 'long') {
						return Number(dv.bitcoinFormatted).toFixed(8);
					}

					return Number(dv.bitcoinFormatted).toFixed(5);
				}

				return dv.bitcoinFormatted;
			}
		}
	}, [dv, unit, denomination, decimalLength]);

	if (hide) {
		if (size === 'display') {
			text = ' • • • • • • • • •';
		} else {
			text = ' • • • • •';
		}
	}

	return (
		<View style={[styles.root, props.style]} testID={testID}>
			{sign && (
				<Text
					style={styles.sign}
					color={color ?? 'secondary'}
					testID="MoneySign">
					{sign}
				</Text>
			)}
			{showSymbol && symbol}
			<Text color={color} testID="MoneyText">
				{text}
			</Text>
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
