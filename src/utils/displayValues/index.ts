import { default as bitcoinUnits } from 'bitcoin-units';

import { getSettingsStore, getWalletStore } from '../../store/helpers';
import { EUnit } from '../../store/types/wallet';
import { IExchangeRates, mostUsedExchangeTickers } from '../exchange-rate';
import {
	defaultFiatDisplayValues,
	defaultBitcoinDisplayValues,
	IBitcoinDisplayValues,
	IDisplayValues,
	IFiatDisplayValues,
} from './types';

export const getBitcoinDisplayValues = ({
	satoshis,
	unit,
}: {
	satoshis: number;
	unit: EUnit;
}): IBitcoinDisplayValues => {
	try {
		if (unit === EUnit.fiat) {
			unit = EUnit.BTC;
		}

		let bitcoinSymbol = '₿';
		let bitcoinTicker = unit;

		let bitcoinFormatted: string = bitcoinUnits(satoshis, 'satoshi')
			.to(unit)
			.value()
			// convert to string without scientific notation and trailing zeros
			.toFixed(10)
			.replace(/\.?0+$/, '');

		const [bitcoinWhole, bitcoinDecimal] = bitcoinFormatted.split('.');

		if (unit === EUnit.satoshi) {
			bitcoinSymbol = '⚡';
			bitcoinTicker = EUnit.satoshi;

			// format sats to group thousands
			// 4000000 -> 4 000 000
			let res = '';
			bitcoinFormatted
				.split('')
				.reverse()
				.forEach((c, index) => {
					if (index > 0 && index % 3 === 0) {
						res = ' ' + res;
					}
					res = c + res;
				});
			bitcoinFormatted = res;
		}

		return {
			bitcoinFormatted,
			bitcoinWhole,
			bitcoinDecimal,
			bitcoinSymbol,
			bitcoinTicker,
			satoshis,
		};
	} catch (e) {
		console.error(e);
		return defaultBitcoinDisplayValues;
	}
};

export const getFiatDisplayValues = ({
	satoshis,
	exchangeRate,
	exchangeRates,
	unit,
	currency,
	currencySymbol,
	locale = 'en-US',
}: {
	satoshis: number;
	exchangeRate?: number;
	exchangeRates?: IExchangeRates;
	unit?: EUnit;
	currency?: string;
	currencySymbol?: string;
	locale?: string;
}): IFiatDisplayValues => {
	if (!exchangeRates) {
		exchangeRates = getWalletStore().exchangeRates;
	}
	if (!currency) {
		currency = getSettingsStore().selectedCurrency;
	}
	if (!unit) {
		unit = getSettingsStore().unit;
	}

	try {
		// If exchange rates haven't loaded yet or failed to load
		// fallback to dollar and show placeholder if amount is not 0
		if (Object.entries(exchangeRates).length === 0) {
			const fallbackTicker =
				mostUsedExchangeTickers[currency] ?? mostUsedExchangeTickers.USD;

			const bitcoinDisplayValues = getBitcoinDisplayValues({
				satoshis: satoshis,
				unit: unit,
			});

			return {
				...bitcoinDisplayValues,
				fiatFormatted: '—',
				fiatWhole: satoshis === 0 ? '0' : '—',
				fiatDecimal: satoshis === 0 ? '00' : '',
				fiatDecimalSymbol: satoshis === 0 ? '.' : '',
				fiatSymbol: fallbackTicker.currencySymbol,
				fiatTicker: fallbackTicker.quote,
				fiatValue: 0,
			};
		}

		if (!exchangeRate) {
			exchangeRate = getWalletStore().exchangeRates[currency].rate;
		}

		// this throws if exchangeRate is 0
		bitcoinUnits.setFiat(currency, exchangeRate);
		let fiatValue: number = bitcoinUnits(satoshis, 'satoshi')
			.to(currency)
			.value();

		return getFiatDisplayValuesForFiat({
			value: fiatValue,
			currency,
			currencySymbol,
			locale,
		});
	} catch (e) {
		console.error(e);

		const fallbackTicker =
			mostUsedExchangeTickers[currency] ?? mostUsedExchangeTickers.USD;

		return {
			fiatFormatted: '—',
			fiatWhole: satoshis === 0 ? '0' : '—',
			fiatDecimal: satoshis === 0 ? '00' : '',
			fiatDecimalSymbol: satoshis === 0 ? '.' : '',
			fiatSymbol: fallbackTicker.currencySymbol,
			fiatTicker: fallbackTicker.quote,
			fiatValue: 0,
		};
	}
};

/**
 * Formats a fiat amount into a displayValue format without conversion
 */
export const getFiatDisplayValuesForFiat = ({
	value,
	currency,
	currencySymbol,
	locale = 'en-US',
}: {
	value: number;
	currency?: string;
	currencySymbol?: string;
	locale?: string;
}): IFiatDisplayValues => {
	if (!currency) {
		currency = getSettingsStore().selectedCurrency;
	}

	let { fiatFormatted, fiatWhole, fiatDecimal, fiatDecimalSymbol, fiatSymbol } =
		defaultFiatDisplayValues;

	let currencyFormat = currency;
	if (currency === 'EUT') {
		currencyFormat = 'EUR';
	}
	if (currency === 'USDT') {
		currencyFormat = 'USD';
	}

	fiatFormatted = '';

	const fiatFormattedIntl = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currencyFormat,
	});

	fiatFormattedIntl.formatToParts(value).forEach((part) => {
		if (part.type === 'currency') {
			fiatSymbol = currencySymbol ?? part.value;
		} else if (part.type === 'integer' || part.type === 'group') {
			fiatWhole = `${fiatWhole}${part.value}`;
		} else if (part.type === 'fraction') {
			fiatDecimal = part.value;
		} else if (part.type === 'decimal') {
			fiatDecimal = part.value;
		}

		if (part.type !== 'currency') {
			fiatFormatted = `${fiatFormatted}${part.value}`;
		}
	});

	fiatFormatted = fiatFormatted.trim();

	return {
		fiatFormatted,
		fiatWhole,
		fiatDecimal,
		fiatDecimalSymbol,
		fiatSymbol,
		fiatTicker: currency,
		fiatValue: value,
	};
};

export const getDisplayValues = ({
	satoshis,
	exchangeRate,
	currency,
	currencySymbol,
	unit,
	locale = 'en-US',
}: {
	satoshis: number;
	exchangeRate?: number;
	currency?: string;
	currencySymbol?: string;
	unit?: EUnit;
	locale?: string;
}): IDisplayValues => {
	const bitcoinDisplayValues = getBitcoinDisplayValues({
		satoshis: satoshis,
		unit: unit ?? EUnit.satoshi,
	});

	const fiatDisplayValues = getFiatDisplayValues({
		satoshis,
		unit: unit,
		exchangeRate,
		currency,
		currencySymbol,
		locale,
	});

	return {
		...bitcoinDisplayValues,
		...fiatDisplayValues,
	};
};
