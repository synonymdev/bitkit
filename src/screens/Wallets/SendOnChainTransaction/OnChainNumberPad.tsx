import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
	getTransactionOutputValue,
	updateAmount,
} from '../../../utils/wallet/transactions';
import AmountButtonRow from '../AmountButtonRow';
import NumberPad from '../../../components/NumberPad';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import { toggleView } from '../../../store/actions/user';
import Store from '../../../store/types';
import { defaultOnChainTransactionData } from '../../../store/types/wallet';
import {
	fiatToBitcoinUnit,
	getDisplayValues,
} from '../../../utils/exchange-rate';
import { btcToSats } from '../../../utils/helpers';
import { useExchangeRate } from '../../../hooks/displayValues';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

/**
 * Handles the number pad logic (add/remove/clear) for on-chain transactions.
 */
const OnChainNumberPad = (): ReactElement => {
	const snapPoints = useMemo(() => [375], []);

	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);

	const unitPreference = useSelector(
		(store: Store) => store.settings.unitPreference,
	);

	const currency = useSelector(
		(store: Store) => store.settings.selectedCurrency,
	);
	const exchangeRate = useExchangeRate(currency);

	const transaction = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultOnChainTransactionData,
	);

	useBottomSheetBackPress('numberPad');

	/*
	 * Retrieves total value of all outputs. Excludes change address.
	 */
	const getAmountToSend = useCallback((): number => {
		try {
			return getTransactionOutputValue({
				selectedWallet,
				selectedNetwork,
			});
		} catch {
			return 0;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	// Add, shift and update the current transaction amount based on the provided fiat value or bitcoin unit.
	const onPress = (key): void => {
		let amount = '0';
		if (unitPreference === 'asset') {
			if (bitcoinUnit === 'BTC') {
				const displayValue = getDisplayValues({ satoshis: getAmountToSend() });
				amount = displayValue.bitcoinFormatted;
				// Add new key and shift decimal place by one.
				amount = String((Number(`${amount}${key}`) * 10).toFixed(8));
				amount = String(btcToSats(Number(amount)));
			} else {
				amount = String(getAmountToSend());
				amount = `${amount}${key}`;
			}
		} else {
			const displayValue = getDisplayValues({ satoshis: getAmountToSend() });
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
		updateAmount({
			amount,
			selectedWallet,
			selectedNetwork,
			index: 0,
		}).then();
	};

	// Shift, remove and update the current transaction amount based on the provided fiat value or bitcoin unit.
	const onRemove = (): void => {
		let amount = '0';
		let newAmount = '0';
		if (unitPreference === 'asset') {
			amount = String(getAmountToSend());
			newAmount = amount.substr(0, amount.length - 1);
		} else {
			const displayValue = getDisplayValues({ satoshis: getAmountToSend() });
			amount = displayValue?.fiatFormatted;
			amount = String(Number(`${amount}`) / 10);
			newAmount = amount.substr(0, amount.lastIndexOf('.') + 3);
			const fiatAmount = fiatToBitcoinUnit({
				fiatValue: newAmount,
				bitcoinUnit,
				exchangeRate,
				currency,
			});
			newAmount = String(fiatAmount);
		}
		updateAmount({
			amount: newAmount,
			selectedWallet,
			selectedNetwork,
			index: 0,
			max: false,
		}).then();
	};

	const onClear = (): void => {
		updateAmount({
			amount: '0',
			selectedWallet,
			selectedNetwork,
			index: 0,
			max: false,
		}).then();
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={false}
			view="numberPad">
			<NumberPad onPress={onPress} onRemove={onRemove} onClear={onClear}>
				<AmountButtonRow
					onDone={(): void => {
						toggleView({ view: 'numberPad', data: { isOpen: false } });
					}}
				/>
			</NumberPad>
		</BottomSheetWrapper>
	);
};

export default memo(OnChainNumberPad);
