import { ok, err, Result } from '@synonymdev/result';

import i18n from '../i18n';
import { timeAgo } from '../helpers';
import { getWalletStore } from '../../store/helpers';
import { __BACKEND_HOST__ } from '../../constants/env';
import { showToast } from '../notifications';

export const mostUsedExchangeTickers = {
	USD: {
		currencySymbol: '$',
		quote: 'USD',
		quoteName: 'US Dollar',
	},
	GBP: {
		currencySymbol: '£',
		quote: 'GBP',
		quoteName: 'Great British Pound',
	},
	CAD: {
		currencySymbol: '$',
		quote: 'CAD',
		quoteName: 'Canadian Dollar',
	},
	CNY: {
		currencySymbol: '¥',
		quote: 'CNY',
		quoteName: 'Chinese Yuan Renminbi',
	},
	EUR: { currencySymbol: '€', quote: 'EUR', quoteName: 'Euro' },
};

type TTicker = {
	symbol: string;
	lastPrice: string;
	base: string;
	baseName: string;
	quote: string;
	quoteName: string;
	currencySymbol: string;
	currencyFlag: string;
	lastUpdatedAt: number;
};

export interface IExchangeRates {
	[key: string]: {
		currencySymbol: string;
		quote: string;
		quoteName: string;
		rate: number;
		lastUpdatedAt: number;
	};
}

export const getExchangeRates = async (): Promise<Result<IExchangeRates>> => {
	const lastUpdatedAt = getWalletStore().exchangeRates.USD?.lastUpdatedAt;

	try {
		const response = await fetch(`${__BACKEND_HOST__}/fx/rates/btc`);
		const { tickers } = await response.json();

		const rates: IExchangeRates = tickers.reduce(
			(acc: IExchangeRates, ticker: TTicker) => {
				return {
					...acc,
					[ticker.quote]: {
						currencySymbol: ticker.currencySymbol,
						quote: ticker.quote,
						quoteName: ticker.quoteName,
						rate: Math.round(Number(ticker.lastPrice) * 100) / 100,
						lastUpdatedAt: ticker.lastUpdatedAt,
					},
				};
			},
			{},
		);

		return ok(rates);
	} catch (e) {
		console.error(e);

		if (lastUpdatedAt) {
			showToast({
				type: 'warning',
				title: i18n.t('other:rate_error_title'),
				description: i18n.t('other:rate_error_msg_date', {
					date: timeAgo(lastUpdatedAt),
				}),
			});
		} else {
			showToast({
				type: 'warning',
				title: i18n.t('other:rate_error_title'),
				description: i18n.t('other:rate_error_msg_nodate'),
			});
		}

		return err(e);
	}
};

export const getExchangeRate = (currency = 'USD'): number => {
	const exchangeRates = getWalletStore().exchangeRates;
	return exchangeRates[currency]?.rate ?? 0;
};
