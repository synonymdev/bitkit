import React, { ReactElement, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSelector } from 'react-redux';

import { Text02B, TouchableOpacity, SwitchIcon } from '../../styles/components';
import NumberPad from '../../components/NumberPad';
import Store from '../../store/types';
import useDisplayValues, { useExchangeRate } from '../../hooks/displayValues';
import { fiatToBitcoinUnit } from '../../utils/exchange-rate';
import { updateSettings } from '../../store/actions/settings';
import { btcToSats } from '../../utils/helpers';

const NumberPadLightning = ({
	sats,
	onChange,
	onDone,
	style,
}: {
	sats: number;
	onChange: (amount: number) => void;
	onDone: () => void;
	style?: object | Array<object>;
}): ReactElement => {
	const [decimalMode, setDecimalMode] = useState(false);
	const [prefixZeros, setPrefixZeros] = useState(0);

	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);
	const unitPreference = useSelector(
		(store: Store) => store.settings.unitPreference,
	);
	const currency = useSelector(
		(store: Store) => store.settings.selectedCurrency,
	);
	const exchangeRate = useExchangeRate(currency);
	const displayValue = useDisplayValues(sats);

	const onPress = (key: number | string): void => {
		let amount = '0';
		let newAmount = 0;

		if (key === '.') {
			setDecimalMode(true);
			return;
		} else {
			setDecimalMode(false);
		}

		if ((decimalMode || prefixZeros !== 0) && key === 0) {
			setPrefixZeros((prevValue) => prevValue + 1);
			return;
		} else {
			setPrefixZeros(0);
		}

		if (unitPreference === 'asset') {
			if (bitcoinUnit === 'BTC') {
				amount = displayValue.bitcoinFormatted;
				amount = String(parseFloat(amount));

				const [, decimals] = amount.split('.');
				if (decimals?.length > 7) {
					return;
				}

				if (decimals?.length > 0 && key === 0) {
					setPrefixZeros((prevValue) => prevValue + 1);
					return;
				}

				if (prefixZeros !== 0) {
					if (decimals?.length > 0) {
						amount = `${amount}${'0'.repeat(prefixZeros)}${key}`;
					} else {
						amount = `${amount}.${'0'.repeat(prefixZeros)}${key}`;
					}
				} else {
					if (decimalMode) {
						amount = `${amount}.${key}`;
					} else {
						amount = `${amount}${key}`;
					}
				}

				amount = String(btcToSats(Number(amount)));
			} else {
				amount = String(sats);
				amount = `${amount}${key}`;
			}
		} else {
			amount = displayValue.fiatValue.toString();

			const [, decimals] = amount.split('.');
			if (decimals?.length > 1) {
				return;
			}

			if (decimals?.length > 0 && key === 0) {
				setPrefixZeros((prevValue) => prevValue + 1);
				return;
			}

			if (prefixZeros !== 0) {
				if (decimals?.length > 0) {
					amount = `${amount}${'0'.repeat(prefixZeros)}${key}`;
				} else {
					amount = `${amount}.${'0'.repeat(prefixZeros)}${key}`;
				}
			} else {
				if (decimalMode) {
					amount = `${amount}.${key}`;
				} else {
					amount = `${amount}${key}`;
				}
			}

			// Convert new fiat amount to satoshis.
			amount = fiatToBitcoinUnit({
				fiatValue: amount,
				bitcoinUnit: 'satoshi',
				currency,
				exchangeRate,
			});
		}

		newAmount = Number(amount);

		// limit amount to 21 000 000 BTC
		if (newAmount > 2.1e15) {
			newAmount = 2.1e15;
		}

		onChange(newAmount);
	};

	const onRemove = (): void => {
		let amount = '0';
		let newAmount = '0';

		if (unitPreference === 'asset') {
			if (bitcoinUnit === 'BTC') {
				amount = displayValue.bitcoinFormatted;
				amount = String(parseFloat(amount));

				// remove last character
				newAmount = amount.replace(/.$/, '');

				newAmount = String(btcToSats(Number(newAmount)));
			} else {
				amount = String(sats);
				newAmount = amount.substring(0, amount.length - 1);
			}
		} else {
			amount = displayValue.fiatValue.toString();

			// remove last character
			newAmount = amount.replace(/.$/, '');

			const fiatAmount = fiatToBitcoinUnit({
				fiatValue: newAmount,
				bitcoinUnit: 'satoshi',
				exchangeRate,
				currency,
			});

			newAmount = String(fiatAmount);
		}

		onChange(Number(newAmount));
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			onPress={onPress}
			onRemove={onRemove}>
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
