import { EBitcoinUnit } from '../../store/types/wallet';

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
	bitcoinWhole: string; // Value before decimal point
	bitcoinDecimal: string; // Value after decimal point
	bitcoinSymbol: string; // ₿, ⚡,
	bitcoinTicker: EBitcoinUnit;
	satoshis: number;
}

export interface IFiatDisplayValues {
	fiatFormatted: string;
	fiatWhole: string; // Value before decimal point
	fiatDecimal: string; // Value after decimal point
	fiatSymbol: string; // $,€,£
	fiatDecimalSymbol: string; // Decimal point "." or ","
	fiatTicker: string; // USD, EUR etc.
	fiatValue: number;
}

export type IDisplayValues = IBitcoinDisplayValues & IFiatDisplayValues;

export const defaultBitcoinDisplayValues: IBitcoinDisplayValues = {
	bitcoinFormatted: '—',
	bitcoinWhole: '',
	bitcoinDecimal: '',
	bitcoinSymbol: '',
	bitcoinTicker: EBitcoinUnit.satoshi,
	satoshis: 0,
};

export const defaultFiatDisplayValues: IFiatDisplayValues = {
	fiatFormatted: '—',
	fiatWhole: '',
	fiatDecimalSymbol: '.',
	fiatDecimal: '00',
	fiatSymbol: '',
	fiatTicker: '',
	fiatValue: 0,
};
