import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import {
	BIcon,
	Caption13M,
	Display,
	Headline,
	LightningIcon,
	Text01M,
	Text01S,
	Text02M,
	Text02S,
	Title,
} from '../styles/components';
import useDisplayValues from '../hooks/displayValues';
import Store from '../store/types';
import { abbreviateNumber } from '../utils/helpers';

interface IMoney {
	sats: number;
	showFiat?: boolean; // if true shows value in fiat, if false shows value in settings.bitcoinUnit. Can be overwritten by unit prop
	unit?: 'fiat' | 'BTC' | 'satoshi'; // force value formatting
	size?:
		| 'display'
		| 'text01s'
		| 'text01m'
		| 'text02s'
		| 'text02m'
		| 'caption13M'
		| 'title'
		| 'headline';
	highlight?: boolean; // grey last 3 chars in sats/bitcoin or decimal in fiat
	symbol?: boolean; // show symbol icon
	color?: string;
	enableHide?: boolean; // if true and settings.hideBalance === true it will replace number with dots
	style?: object;
	sign?: string;
}

const Money = (props: IMoney): ReactElement => {
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const hideBalance = useSelector((state: Store) => state.settings.hideBalance);

	let sats = props.sats ?? 0;
	const highlight = props.highlight ?? false;
	const size = props.size ?? 'display';
	const showFiat = props.showFiat ?? false;
	const unit = props.unit ?? (showFiat ? 'fiat' : bitcoinUnit);
	const showSymbol = props.symbol ?? (unit === 'fiat' ? true : false);
	const color = props.color;
	const hide = (props.enableHide ?? false) && hideBalance;
	const sign = props.sign;

	sats = Math.abs(sats);
	const dv = useDisplayValues(sats, unit === 'fiat' ? 'BTC' : unit);

	const style = useMemo(
		() => StyleSheet.compose(styles.root, props.style),
		[props.style],
	);

	const [Text, iconHeight, iconWidth] = useMemo(() => {
		switch (size) {
			case 'headline':
				return [Headline, 40, 20];
			case 'title':
				return [Title, 26, 12];
			case 'text01s':
				return [Text01S, 21, 10];
			case 'text01m':
				return [Text01M, 21, 10];
			case 'text02s':
				return [Text02S, 18, 9];
			case 'text02m':
				return [Text02M, 18, 9];
			case 'caption13M':
				return [Caption13M, 16, 8];
			default:
				return [Display, 39, 25];
		}
	}, [size]);

	const symbol = useMemo(() => {
		switch (unit) {
			case 'fiat':
				return (
					<Text color={color ?? 'gray2'} style={styles.symbol}>
						{dv.fiatSymbol}
					</Text>
				);
			case 'satoshi':
				return (
					<LightningIcon
						color={color ?? 'gray2'}
						height={iconHeight}
						width={iconWidth}
						style={styles.symbol}
					/>
				);
			default:
				return (
					<BIcon
						color={color ?? 'gray2'}
						height={iconHeight}
						width={iconWidth}
						style={styles.symbol}
					/>
				);
		}
	}, [unit, Text, iconHeight, iconWidth, dv.fiatSymbol, color]);

	let [prim = '', secd = ''] = useMemo(() => {
		switch (unit) {
			case 'fiat':
				if (dv.fiatWhole.length > 12) {
					const { newValue, abbreviation } = abbreviateNumber(dv.fiatWhole);
					return highlight
						? [newValue, abbreviation]
						: [newValue + abbreviation];
				}
				return highlight
					? [dv.fiatWhole, dv.fiatDecimal + dv.fiatDecimalValue]
					: [dv.fiatFormatted];
			case 'satoshi': {
				// No highlight effect for denomination in sats
				return [dv.bitcoinFormatted];
			}
			default: {
				const value = dv.bitcoinFormatted;
				if (!highlight || !value.includes(dv.fiatDecimal) || sats < 999999) {
					return [value];
				}
				return [value.slice(0, -3), value.slice(-3)];
			}
		}
	}, [highlight, dv, unit, sats]);

	if (hide) {
		prim = ' • • • • • • • • • •';
		secd = '';
	}

	return (
		<View style={style}>
			{sign && (
				<Text style={styles.sign} color={color ?? 'gray2'}>
					{sign}
				</Text>
			)}
			{showSymbol && symbol}
			<Text color={color}>{prim}</Text>
			{secd !== '' && <Text color="gray2">{secd}</Text>}
		</View>
	);
};

export default memo(Money);

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
