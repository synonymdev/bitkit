import { default as bitcoinUnits } from 'bitcoin-units';
import { getSettingsStore } from '../store/helpers';
import { EConversionUnit, EDenomination } from '../store/types/wallet';
import { getFiatDisplayValues } from './displayValues';
import { IFiatDisplayValues } from './displayValues/types';
import { getExchangeRate } from './exchange-rate';

export const btcToSats = (balance: number): number => {
	try {
		return Number(
			bitcoinUnits(balance, EConversionUnit.BTC)
				.to(EConversionUnit.satoshi)
				.value()
				.toFixed(0),
		);
	} catch (_e) {
		return 0;
	}
};

export const satsToBtc = (balance: number): number => {
	return bitcoinUnits(balance, 'sats').to('BTC').value();
};

/**
 * Converts an amount of currency in a specific unit to satoshis
 */
export const convertToSats = (
	value: number | string,
	unit: EConversionUnit,
	currency?: string,
): number => {
	const amount = Number(value);

	if (unit === EConversionUnit.BTC) {
		return btcToSats(amount);
	}

	if (unit === EConversionUnit.fiat) {
		const denomination = getSettingsStore().denomination;
		const btcUnit = fiatToBitcoinUnit({ amount, currency });
		return denomination === EDenomination.modern ? btcUnit : btcToSats(btcUnit);
	}

	return amount;
};

export const fiatToBitcoinUnit = ({
	amount,
	exchangeRate,
	currency,
}: {
	amount: string | number;
	exchangeRate?: number;
	currency?: string;
}): number => {
	const denomination = getSettingsStore().denomination;

	if (!currency) {
		currency = getSettingsStore().selectedCurrency;
	}
	if (!exchangeRate) {
		exchangeRate = getExchangeRate(currency);
	}
	const unit =
		denomination === EDenomination.modern
			? EConversionUnit.satoshi
			: EConversionUnit.BTC;

	try {
		// this throws if exchangeRate is 0
		bitcoinUnits.setFiat(currency, exchangeRate);
		const value = bitcoinUnits(Number(amount), currency)
			.to(unit)
			.value()
			.toFixed(denomination === EDenomination.modern ? 0 : 8); // satoshi cannot be a fractional number

		return Number(value);
	} catch (_e) {
		return 0;
	}
};

/**
 * Converts from one fiat to another
 */
export const convertCurrency = ({
	amount,
	from,
	to,
}: {
	amount: number;
	from: string;
	to: string;
}): IFiatDisplayValues => {
	const sats = fiatToBitcoinUnit({
		amount,
		currency: from,
	});
	return getFiatDisplayValues({
		satoshis: sats,
		currency: to,
	});
};
