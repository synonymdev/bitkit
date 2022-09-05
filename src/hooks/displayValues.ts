import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Store from '../store/types';
import { getDisplayValues } from '../utils/exchange-rate';
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

	bitcoinUnit = bitcoinUnit ?? stateUnit;

	const currencySymbol = exchangeRates[selectedCurrency]?.currencySymbol;

	const displayValues: IDisplayValues = useMemo(() => {
		return getDisplayValues({
			satoshis,
			bitcoinUnit,
			currencySymbol,
			locale: 'en-US', //TODO get from native module
		});
	}, [satoshis, bitcoinUnit, currencySymbol]);

	return displayValues;
}

/**
 * Returns 0 if no exchange rate for currency found or something goes wrong
 */
export const useExchangeRate = (currency = 'EUR'): number => {
	try {
		const exchangeRates = useSelector(
			(state: Store) => state.wallet.exchangeRates,
		);
		return exchangeRates[currency]?.rate ?? 0;
	} catch {
		return 0;
	}
};
