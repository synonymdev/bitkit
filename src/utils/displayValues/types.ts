export interface IBitcoinDisplayValues {
	bitcoinFormatted: string;
	bitcoinWhole: string; // Value before decimal point
	bitcoinDecimal: string; // Value after decimal point
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
