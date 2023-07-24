import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getExchangeRate } from '../utils/exchange-rate';
import { getDisplayValues } from '../utils/displayValues';
import { IDisplayValues } from '../utils/displayValues/types';
import { EUnit } from '../store/types/wallet';
import { exchangeRatesSelector } from '../store/reselect/wallet';
import {
	primaryUnitSelector,
	selectedCurrencySelector,
} from '../store/reselect/settings';

export default function useDisplayValues(
	satoshis: number,
	unit?: EUnit,
): IDisplayValues {
	const primaryUnit = useSelector(primaryUnitSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const exchangeRates = useSelector(exchangeRatesSelector);
	const exchangeRate = useMemo(
		() => getExchangeRate(selectedCurrency),
		[selectedCurrency],
	);
	const unit2 = useMemo(() => {
		if (unit) {
			return unit;
		}
		if (primaryUnit !== EUnit.fiat) {
			return primaryUnit;
		}
		return EUnit.satoshi;
	}, [unit, primaryUnit]);
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
			unit: unit2,
			locale: 'en-US', //TODO get from native module
		});
	}, [satoshis, exchangeRate, selectedCurrency, currencySymbol, unit2]);
}

/**
 * Returns the symbol for the currently selected fiat currency
 */
export const useCurrency = (): {
	fiatTicker: string;
	fiatSymbol: string;
} => {
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const exchangeRates = useSelector(exchangeRatesSelector);
	const symbol = exchangeRates[selectedCurrency]?.currencySymbol;

	return {
		fiatTicker: selectedCurrency,
		fiatSymbol: symbol,
	};
};

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
