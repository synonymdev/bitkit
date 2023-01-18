import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../../components/NumberPad';
import { updateInvoice } from '../../../store/actions/receive';
import Store from '../../../store/types';
import { btcToSats } from '../../../utils/helpers';
import { useExchangeRate } from '../../../hooks/displayValues';
import { EBitcoinUnit } from '../../../store/types/wallet';
import {
	fiatToBitcoinUnit,
	getDisplayValues,
} from '../../../utils/exchange-rate';
import {
	selectedCurrencySelector,
	unitPreferenceSelector,
} from '../../../store/reselect/settings';

/**
 * Handles the number pad logic (add/remove/clear) for invoices.
 */
const ReceiveNumberPad = ({
	style,
}: {
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const [decimalMode, setDecimalMode] = useState(false);
	const [prefixZeros, setPrefixZeros] = useState(0);
	const invoice = useSelector((store: Store) => store.receive);
	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);
	const unitPreference = useSelector(unitPreferenceSelector);
	const currency = useSelector(selectedCurrencySelector);
	const exchangeRate = useExchangeRate(currency);

	// Add, shift and update the current invoice amount based on the provided fiat value or bitcoin unit.
	const onPress = (key: number | string): void => {
		let amount = '0';

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
				const displayValue = getDisplayValues({ satoshis: invoice.amount });
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
				amount = String(invoice.amount);
				amount = `${amount}${key}`;
			}
		} else {
			const displayValue = getDisplayValues({ satoshis: invoice.amount });
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
			amount = String(
				fiatToBitcoinUnit({
					fiatValue: amount,
					bitcoinUnit: EBitcoinUnit.satoshi,
					currency,
					exchangeRate,
				}),
			);
		}
		updateInvoice({ amount: Number(amount) });
	};

	// Shift, remove and update the current invoice amount based on the provided fiat value or bitcoin unit.
	const onRemove = (): void => {
		let amount = '0';
		let newAmount = '0';
		if (unitPreference === 'asset') {
			if (bitcoinUnit === 'BTC') {
				const displayValue = getDisplayValues({ satoshis: invoice.amount });
				amount = displayValue.bitcoinFormatted;
				amount = String(parseFloat(amount));

				// remove last character
				newAmount = amount.replace(/.$/, '');

				newAmount = String(btcToSats(Number(newAmount)));
			} else {
				amount = String(invoice.amount);
				newAmount = amount.substring(0, amount.length - 1);
			}
		} else {
			const displayValue = getDisplayValues({ satoshis: invoice.amount });
			amount = displayValue.fiatValue.toString();

			// remove last character
			newAmount = amount.replace(/.$/, '');

			const fiatAmount = fiatToBitcoinUnit({
				fiatValue: newAmount,
				bitcoinUnit: EBitcoinUnit.satoshi,
				exchangeRate,
				currency,
			});

			newAmount = String(fiatAmount);
		}

		updateInvoice({ amount: Number(newAmount) });
	};

	const numberPadType =
		unitPreference === 'asset' && bitcoinUnit === EBitcoinUnit.satoshi
			? 'integer'
			: 'decimal';

	return (
		<NumberPad
			style={style}
			type={numberPadType}
			onPress={onPress}
			onRemove={onRemove}
		/>
	);
};

export default memo(ReceiveNumberPad);
