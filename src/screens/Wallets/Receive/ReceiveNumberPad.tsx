import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import AmountButtonRow from '../AmountButtonRow';
import NumberPad from '../../../components/NumberPad';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import { toggleView } from '../../../store/actions/user';
import { updateInvoice } from '../../../store/actions/receive';
import Store from '../../../store/types';
import {
	fiatToBitcoinUnit,
	getDisplayValues,
} from '../../../utils/exchange-rate';
import { btcToSats } from '../../../utils/helpers';
import { useExchangeRate } from '../../../hooks/displayValues';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

/**
 * Handles the number pad logic (add/remove/clear) for invoices.
 */
const ReceiveNumberPad = (): ReactElement => {
	const snapPoints = useMemo(() => [375], []);
	const invoice = useSelector((store: Store) => store.receive);
	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);
	const unitPreference = useSelector(
		(store: Store) => store.settings.unitPreference,
	);
	const currency = useSelector(
		(store: Store) => store.settings.selectedCurrency,
	);
	const exchangeRate = useExchangeRate(currency);

	useBottomSheetBackPress('numberPadReceive');

	// Add, shift and update the current invoice amount based on the provided fiat value or bitcoin unit.
	const onPress = (key): void => {
		let amount = '0';
		if (unitPreference === 'asset') {
			if (bitcoinUnit === 'BTC') {
				const displayValue = getDisplayValues({ satoshis: invoice.amount });
				amount = displayValue.bitcoinFormatted;
				// Add new key and shift decimal place by one.
				amount = String((Number(`${amount}${key}`) * 10).toFixed(8));
				amount = String(btcToSats(Number(amount)));
			} else {
				amount = String(invoice.amount);
				amount = `${amount}${key}`;
			}
		} else {
			const displayValue = getDisplayValues({ satoshis: invoice.amount });
			amount = displayValue.fiatFormatted;
			// Add new key and shift decimal place by one.
			amount = String((Number(`${amount}${key}`) * 10).toFixed(2));
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
			amount = String(invoice.amount);
			newAmount = amount.substring(0, amount.length - 1);
		} else {
			const displayValue = getDisplayValues({ satoshis: invoice.amount });
			amount = displayValue?.fiatFormatted;
			amount = String(Number(`${amount}`) / 10);
			newAmount = amount.substring(0, amount.lastIndexOf('.') + 3);
			const fiatAmount = fiatToBitcoinUnit({
				fiatValue: newAmount,
				bitcoinUnit,
				exchangeRate,
				currency,
			});
			newAmount = String(fiatAmount);
		}
		updateInvoice({ amount: Number(newAmount) });
	};

	const onClear = (): void => {
		updateInvoice({ amount: 0 });
	};

	const onDone = (): void => {
		toggleView({ view: 'numberPadReceive', data: { isOpen: false } });
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={false}
			view="numberPadReceive">
			<NumberPad onPress={onPress} onRemove={onRemove} onClear={onClear}>
				<AmountButtonRow showMaxButton={false} onDone={onDone} />
			</NumberPad>
		</BottomSheetWrapper>
	);
};

export default memo(ReceiveNumberPad);
