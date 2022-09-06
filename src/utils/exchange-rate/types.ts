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

export interface IExchangeRates {
	[key: string]: {
		currencySymbol: string;
		quote: string;
		quoteName: string;
		rate: number;
		lastUpdatedAt: number;
	};
}

export interface IBitcoinDisplayValues {
	bitcoinFormatted: string;
	bitcoinSymbol: string; //₿, m₿, μ₿, ⚡,
	bitcoinTicker: string; //BTC, mBTC, μBTC, Sats
	satoshis: number;
}

export interface IFiatDisplayValues {
	fiatFormatted: string;
	fiatWhole: string; //Value before decimal point
	fiatDecimal: string; //Decimal point "." or ","
	fiatDecimalValue: string; // Value after decimal point
	fiatSymbol: string; //$,€,£
	fiatTicker: string; //USD, EUR
	fiatValue: number;
}

export type IDisplayValues = IBitcoinDisplayValues & IFiatDisplayValues;

export const defaultBitcoinDisplayValues: IBitcoinDisplayValues = {
	bitcoinFormatted: '—',
	bitcoinSymbol: '',
	bitcoinTicker: '',
	satoshis: 0,
};

export const defaultFiatDisplayValues: IFiatDisplayValues = {
	fiatFormatted: '—',
	fiatWhole: '',
	fiatDecimal: '',
	fiatDecimalValue: '',
	fiatSymbol: '',
	fiatTicker: '',
	fiatValue: 0,
};
