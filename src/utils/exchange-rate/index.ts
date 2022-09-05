import { default as bitcoinUnits } from 'bitcoin-units';
import { ok, err, Result } from '@synonymdev/result';
import { getStore } from '../../store/helpers';
import { TBitcoinUnit } from '../../store/types/wallet';
import {
	defaultFiatDisplayValues,
	defaultBitcoinDisplayValues,
	IBitcoinDisplayValues,
	IDisplayValues,
	IExchangeRates,
	IFiatDisplayValues,
	mostUsedExchangeTickers,
} from './types';
import { showErrorNotification } from '../notifications';

export const getExchangeRates = async (): Promise<Result<IExchangeRates>> => {
	try {
		// TODO: pull this out into .env
		const response = await fetch('http://35.233.47.252:443/fx/rates/btc');
		const { tickers } = await response.json();

		const rates: IExchangeRates = tickers.reduce((acc, ticker) => {
			return {
				...acc,
				[ticker.quote]: {
					currencySymbol: ticker.currencySymbol,
					quote: ticker.quote,
					quoteName: ticker.quoteName,
					rate: Math.round(Number(ticker.lastPrice) * 100) / 100,
				},
			};
		}, {});

		return ok(rates);
	} catch (e) {
		showErrorNotification({
			title: 'Blocktank FX API Error',
			message: 'Could not get exchange rate, using last known price.',
		});
		console.error(e);
		return err(e);
	}
};

export const fiatToBitcoinUnit = ({
	fiatValue,
	exchangeRate,
	currency,
	bitcoinUnit,
}: {
	fiatValue: string;
	exchangeRate?: number;
	currency?: string;
	bitcoinUnit?: TBitcoinUnit;
}): string => {
	if (!currency) {
		currency = getStore().settings.selectedCurrency;
	}
	if (!exchangeRate) {
		exchangeRate = getExchangeRate(currency);
	}
	if (!bitcoinUnit) {
		bitcoinUnit = getStore().settings.bitcoinUnit;
	}

	try {
		// this throws if exchangeRate is 0
		bitcoinUnits.setFiat(currency, exchangeRate);
		const value = bitcoinUnits(Number(fiatValue), currency)
			.to(bitcoinUnit)
			.value()
			.toFixed(bitcoinUnit === 'satoshi' ? 0 : 8); // satoshi cannot be a fractional number

		return value;
	} catch (e) {
		return '';
	}
};

export const getBitcoinDisplayValues = ({
	satoshis,
	bitcoinUnit,
}: {
	satoshis: number;
	bitcoinUnit?: TBitcoinUnit;
}): IBitcoinDisplayValues => {
	try {
		if (!bitcoinUnit) {
			bitcoinUnit = getStore().settings.bitcoinUnit;
		}

		let bitcoinFormatted: string = bitcoinUnits(satoshis, 'satoshi')
			.to(bitcoinUnit)
			.value()
			.toFixed(bitcoinUnit === 'satoshi' ? 0 : 8)
			.toString();

		// format sats to group thousands
		// 4000000 -> 4 000 000
		if (bitcoinUnit === 'satoshi') {
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

		let bitcoinSymbol = '';
		let bitcoinTicker = bitcoinUnit.toString();
		switch (bitcoinUnit) {
			case 'BTC':
				bitcoinSymbol = '₿';
				break;
			case 'mBTC':
				bitcoinSymbol = 'm₿';
				break;
			case 'μBTC':
				bitcoinSymbol = 'μ₿';
				break;
			case 'satoshi':
				bitcoinSymbol = '⚡';
				bitcoinTicker = 'sats';
				break;
		}

		return {
			bitcoinFormatted,
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
	currency,
	currencySymbol,
	bitcoinUnit,
	locale = 'en-US',
}: {
	satoshis: number;
	exchangeRate?: number;
	currency?: string;
	currencySymbol?: string;
	bitcoinUnit?: TBitcoinUnit;
	locale?: string;
}): IFiatDisplayValues => {
	const store = getStore();
	const exchangeRates = store.wallet.exchangeRates;

	if (!currency) {
		currency = store.settings.selectedCurrency;
	}
	if (!bitcoinUnit) {
		bitcoinUnit = store.settings.bitcoinUnit;
	}

	try {
		// If exchange rates haven't loaded yet or failed to load
		// fallback to dollar and show placeholder if amount is not 0
		if (Object.entries(exchangeRates).length === 0) {
			const fallbackTicker =
				mostUsedExchangeTickers[currency] ?? mostUsedExchangeTickers.USD;

			const bitcoinDisplayValues = getBitcoinDisplayValues({
				satoshis: satoshis,
				bitcoinUnit: bitcoinUnit,
			});

			return {
				...bitcoinDisplayValues,
				fiatFormatted: '—',
				fiatWhole: satoshis === 0 ? '0' : '—',
				fiatDecimal: satoshis === 0 ? '.' : '',
				fiatDecimalValue: satoshis === 0 ? '00' : '',
				fiatSymbol: fallbackTicker.currencySymbol,
				fiatTicker: fallbackTicker.quote,
				fiatValue: 0,
			};
		}

		if (!exchangeRate) {
			exchangeRate = store.wallet.exchangeRates[currency].rate;
		}

		// this throws if exchangeRate is 0
		bitcoinUnits.setFiat(currency, exchangeRate);
		let fiatValue: number = bitcoinUnits(satoshis, 'satoshi')
			.to(currency)
			.value()
			.toFixed(2);

		let {
			fiatFormatted,
			fiatWhole,
			fiatDecimal,
			fiatDecimalValue,
			fiatSymbol,
		} = defaultFiatDisplayValues;

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

		fiatFormattedIntl.formatToParts(fiatValue).forEach((part) => {
			if (part.type === 'currency') {
				fiatSymbol = currencySymbol ?? part.value;
			} else if (part.type === 'integer' || part.type === 'group') {
				fiatWhole = `${fiatWhole}${part.value}`;
			} else if (part.type === 'fraction') {
				fiatDecimalValue = part.value;
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
			fiatDecimalValue,
			fiatSymbol,
			fiatTicker: currency,
			fiatValue: Number(fiatValue),
		};
	} catch (e) {
		console.error(e);

		const fallbackTicker =
			mostUsedExchangeTickers[currency] ?? mostUsedExchangeTickers.USD;

		return {
			fiatFormatted: '—',
			fiatWhole: satoshis === 0 ? '0' : '—',
			fiatDecimal: satoshis === 0 ? '.' : '',
			fiatDecimalValue: satoshis === 0 ? '00' : '',
			fiatSymbol: fallbackTicker.currencySymbol,
			fiatTicker: fallbackTicker.quote,
			fiatValue: 0,
		};
	}
};

export const getDisplayValues = ({
	satoshis,
	exchangeRate,
	currency,
	currencySymbol,
	bitcoinUnit,
	locale = 'en-US',
}: {
	satoshis: number;
	exchangeRate?: number;
	currency?: string;
	currencySymbol?: string;
	bitcoinUnit?: TBitcoinUnit;
	locale?: string;
}): IDisplayValues => {
	const bitcoinDisplayValues = getBitcoinDisplayValues({
		satoshis: satoshis,
		bitcoinUnit: bitcoinUnit,
	});

	const fiatDisplayValues = getFiatDisplayValues({
		satoshis: satoshis,
		bitcoinUnit: bitcoinUnit,
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

export const getExchangeRate = (currency = 'EUR'): number => {
	try {
		const exchangeRates = getStore().wallet.exchangeRates;
		return exchangeRates[currency]?.rate ?? 0;
	} catch {
		return 0;
	}
};
