import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';

import NumberPadButtons from '../NumberPadButtons';
import NumberPad from '../../../components/NumberPad';
import { updateInvoice } from '../../../store/actions/receive';
import Store from '../../../store/types';
import { btcToSats } from '../../../utils/helpers';
import { useExchangeRate } from '../../../hooks/displayValues';
import {
	fiatToBitcoinUnit,
	getDisplayValues,
} from '../../../utils/exchange-rate';

/**
 * Handles the number pad logic (add/remove/clear) for invoices.
 */
const ReceiveNumberPad = ({ onDone }: { onDone: () => void }): ReactElement => {
	const [decimalMode, setDecimalMode] = useState(false);
	const [prefixZeros, setPrefixZeros] = useState(0);
	const invoice = useSelector((store: Store) => store.receive);
	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);
	const unitPreference = useSelector(
		(store: Store) => store.settings.unitPreference,
	);
	const currency = useSelector(
		(store: Store) => store.settings.selectedCurrency,
	);
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
					bitcoinUnit: 'satoshi',
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
				bitcoinUnit: 'satoshi',
				exchangeRate,
				currency,
			});

			newAmount = String(fiatAmount);
		}

		updateInvoice({ amount: Number(newAmount) });
	};

	const numberPadType =
		unitPreference === 'asset' && bitcoinUnit === 'satoshi'
			? 'integer'
			: 'decimal';

	return (
		<NumberPad type={numberPadType} onPress={onPress} onRemove={onRemove}>
			<NumberPadButtons onDone={onDone} />
		</NumberPad>
	);
};

export default memo(ReceiveNumberPad);
