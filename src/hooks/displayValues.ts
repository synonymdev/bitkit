import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Store from '../store/types';
import { getDisplayValues, getExchangeRate } from '../utils/exchange-rate';
import { IDisplayValues } from '../utils/exchange-rate/types';
import { TBitcoinUnit } from '../store/types/wallet';

export default function useDisplayValues(
	satoshis: number,
	bitcoinUnit?: TBitcoinUnit,
): IDisplayValues {
	const stateUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);
	const exchangeRates = useSelector(
		(state: Store) => state.wallet.exchangeRates,
	);
	const currency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);
	const exchangeRate = useMemo(() => getExchangeRate(currency), [currency]);
	bitcoinUnit = useMemo(
		() => bitcoinUnit ?? stateUnit,
		[bitcoinUnit, stateUnit],
	);
	const currencySymbol = useMemo(
		() => exchangeRates[selectedCurrency]?.currencySymbol,
		[exchangeRates, selectedCurrency],
	);
	return useMemo(() => {
		return getDisplayValues({
			satoshis,
			exchangeRate,
			currency,
			currencySymbol,
			bitcoinUnit,
			locale: 'en-US', //TODO get from native module
		});
	}, [satoshis, exchangeRate, currency, currencySymbol, bitcoinUnit]);
}

/**
 * Returns 0 if no exchange rate for currency found or something goes wrong
 */
export const useExchangeRate = (currency = 'EUR'): number => {
	const exchangeRates = useSelector(
		(state: Store) => state.wallet.exchangeRates,
	);
	return useMemo(
		() => exchangeRates[currency]?.rate ?? 0,
		[currency, exchangeRates],
	);
};
