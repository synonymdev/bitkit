import React, { ReactElement } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSelector } from 'react-redux';

import { Text02B, TouchableOpacity, SwitchIcon } from '../../styles/components';
import NumberPad from '../../components/NumberPad';
import Store from '../../store/types';
import useDisplayValues from '../../hooks/displayValues';
import { fiatToBitcoinUnit } from '../../utils/exchange-rate';
import { updateSettings } from '../../store/actions/settings';

const NumberPadLightning = ({
	sats,
	onChange,
	onDone,
	style,
}: {
	sats: number;
	onChange: Function;
	onDone: Function;
	style?: object | Array<object>;
}): ReactElement => {
	const unitPreference = useSelector(
		(store: Store) => store.settings.unitPreference,
	);
	const currency = useSelector(
		(store: Store) => store.settings.selectedCurrency,
	);
	const exchangeRate = useSelector(
		(store: Store) => store.wallet.exchangeRates[currency],
	);

	const displayValue = useDisplayValues(sats);

	const onPress = (key): void => {
		let amount = 0;
		if (unitPreference === 'asset') {
			amount = Number(`${sats}${key}`);
		} else {
			// let str = displayValue.fiatFormatted;
			let str = displayValue.fiatValue.toFixed(2);
			// Add new key and shift decimal place by one.
			str = (Number(`${str}${key}`) * 10).toFixed(2);
			// Convert new fiat amount to satoshis.
			str = fiatToBitcoinUnit({
				fiatValue: str,
				bitcoinUnit: 'satoshi',
				exchangeRate,
				currency,
			});
			amount = Math.round(Number(str));
		}
		// limit amount to 21 000 000 BTC
		if (amount > 2.1e15) {
			amount = 2.1e15;
		}
		onChange(amount);
	};

	const onRemove = (): void => {
		let amount = 0;
		if (unitPreference === 'asset') {
			let str = String(sats);
			str = str.substr(0, str.length - 1);
			amount = Number(str);
		} else {
			let str = displayValue.fiatValue.toFixed(2);
			str = String(Number(str) / 10);
			str = str.substr(0, str.lastIndexOf('.') + 3);
			str = fiatToBitcoinUnit({
				fiatValue: str,
				bitcoinUnit: 'satoshi',
				exchangeRate,
				currency,
			});
			amount = Math.round(Number(str));
		}
		onChange(amount);
	};

	const onClear = (): void => {
		onChange(0);
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			onPress={onPress}
			onRemove={onRemove}
			onClear={onClear}>
			<View style={styles.topRow}>
				<TouchableOpacity
					style={styles.topRowButtons}
					color="onSurface"
					onPress={(): void => {
						Alert.alert('TODO');
					}}>
					<Text02B size="12px" color="purple">
						MAX
					</Text02B>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.topRowButtons}
					color="onSurface"
					onPress={(): void => {
						const newUnitPreference =
							unitPreference === 'asset' ? 'fiat' : 'asset';
						updateSettings({ unitPreference: newUnitPreference });
					}}>
					<SwitchIcon color="white" width={16.44} height={13.22} />
					<Text02B size="12px" color="purple" style={styles.middleButtonText}>
						{unitPreference === 'asset'
							? displayValue.fiatTicker
							: displayValue.bitcoinTicker}
					</Text02B>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.topRowButtons}
					color="onSurface"
					onPress={onDone}>
					<Text02B size="12px" color="purple">
						DONE
					</Text02B>
				</TouchableOpacity>
			</View>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 350,
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 5,
		paddingHorizontal: 5,
		// TODO: replace shadow with proper gradient
		shadowColor: 'rgba(185, 92, 232, 0.36)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
	topRowButtons: {
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	middleButtonText: {
		marginLeft: 11,
	},
});

export default NumberPadLightning;
