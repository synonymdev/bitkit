import { useMemo } from 'react';
import { useAppSelector } from '../hooks/redux';
import {
	denominationSelector,
	selectedCurrencySelector,
	unitSelector,
} from '../store/reselect/settings';
import {
	exchangeRateSelector,
	exchangeRatesSelector,
} from '../store/reselect/wallet';
import { EUnit } from '../store/types/wallet';
import { getDisplayValues } from '../utils/displayValues';
import { IDisplayValues } from '../utils/displayValues/types';

export const useDisplayValues = (
	satoshis: number,
	shouldRoundUpFiat = false,
): IDisplayValues => {
	const { fiatSymbol } = useCurrency();
	const selectedCurrency = useAppSelector(selectedCurrencySelector);
	const denomination = useAppSelector(denominationSelector);
	const exchangeRate = useAppSelector((state) => {
		return exchangeRateSelector(state, selectedCurrency);
	});

	return useMemo(() => {
		return getDisplayValues({
			satoshis,
			denomination,
			exchangeRate,
			currency: selectedCurrency,
			currencySymbol: fiatSymbol,
			locale: 'en-US', //TODO get from native module
			shouldRoundUpFiat,
		});
	}, [
		satoshis,
		denomination,
		selectedCurrency,
		exchangeRate,
		fiatSymbol,
		shouldRoundUpFiat,
	]);
};

/**
 * Returns the symbol for the currently selected fiat currency
 */
export const useCurrency = (): {
	fiatTicker: string;
	fiatSymbol: string;
} => {
	const selectedCurrency = useAppSelector(selectedCurrencySelector);
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	const symbol = exchangeRates[selectedCurrency]?.currencySymbol;

	return {
		fiatTicker: selectedCurrency,
		fiatSymbol: symbol,
	};
};

/**
 * Returns the exchange rate for the currently selected fiat currency
 */
export const useExchangeRate = (currency = 'USD'): number => {
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	return useMemo(() => {
		return exchangeRates[currency]?.rate ?? 0;
	}, [currency, exchangeRates]);
};

/**
 * Returns the formatted display value for the current unit
 */
export const useCurrentDisplayValue = (
	...props: Parameters<typeof useDisplayValues>
): string => {
	const unit = useAppSelector(unitSelector);
	const dv = useDisplayValues(...props);
	return unit === EUnit.BTC
		? `₿${dv.bitcoinFormatted}`
		: dv.fiatSymbol + dv.fiatFormatted;
};
