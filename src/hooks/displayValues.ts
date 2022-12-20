import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getDisplayValues, getExchangeRate } from '../utils/exchange-rate';
import { IDisplayValues } from '../utils/exchange-rate/types';
import { EBitcoinUnit } from '../store/types/wallet';
import {
	bitcoinUnitSelector,
	selectedCurrencySelector,
} from '../store/reselect/settings';
import { exchangeRatesSelector } from '../store/reselect/wallet';

export default function useDisplayValues(
	satoshis: number,
	bitcoinUnit?: EBitcoinUnit,
): IDisplayValues {
	const stateUnit = useSelector(bitcoinUnitSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const exchangeRates = useSelector(exchangeRatesSelector);
	const exchangeRate = useMemo(
		() => getExchangeRate(selectedCurrency),
		[selectedCurrency],
	);
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
			currency: selectedCurrency,
			currencySymbol,
			bitcoinUnit,
			locale: 'en-US', //TODO get from native module
		});
	}, [satoshis, exchangeRate, selectedCurrency, currencySymbol, bitcoinUnit]);
}

/**
 * Returns 0 if no exchange rate for currency found or something goes wrong
 */
export const useExchangeRate = (currency = 'EUR'): number => {
	const exchangeRates = useSelector(exchangeRatesSelector);
	return useMemo(
		() => exchangeRates[currency]?.rate ?? 0,
		[currency, exchangeRates],
	);
};
