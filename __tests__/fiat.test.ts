import '../src/utils/i18n';
import { dispatch, getWalletStore } from '../src/store/helpers';
import { resetExchangeRates } from '../src/store/slices/wallet';
import { updateExchangeRates } from '../src/store/actions/wallet';
import { getDisplayValues } from '../src/utils/displayValues';
import { EConversionUnit, EDenomination } from '../src/store/types/wallet';
import { convertToSats } from '../src/utils/conversion';
import {
	resetSettingsState,
	updateSettings,
} from '../src/store/slices/settings';

// @ts-ignore
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				tickers: [
					{
						symbol: 'BTCRUB',
						lastPrice: '4000000',
						base: 'BTC',
						baseName: 'Bitcoin',
						quote: 'RUB',
						quoteName: 'Russian Ruble',
						currencySymbol: '₽',
						currencyFlag: '🇷🇺',
						lastUpdatedAt: 1702295587246,
					},
					{
						symbol: 'BTCUSD',
						lastPrice: '50000.00',
						base: 'BTC',
						baseName: 'Bitcoin',
						quote: 'USD',
						quoteName: 'US Dollar',
						currencySymbol: '$',
						currencyFlag: '🇺🇸',
						lastUpdatedAt: 1702295629052,
					},
				],
			}),
	}),
);

describe('Pulls latest fiat exchange rates and checks the wallet store for valid conversions', () => {
	beforeAll(() => dispatch(resetExchangeRates()));

	it('handles missing exchange rate by returning the correct fiat fallback', () => {
		const dv1 = getDisplayValues({ satoshis: 1010101 });

		// expected fiat fallback
		expect(dv1.fiatFormatted).toBe('—');
		expect(dv1.fiatWhole).toBe('—');
		expect(dv1.fiatDecimal).toBe('');
		expect(dv1.fiatDecimalSymbol).toBe('');
		expect(dv1.fiatSymbol).toBe('$');
		expect(dv1.fiatTicker).toBe('USD');
		expect(dv1.fiatValue).toBe(0);

		// expected BTC conversion
		expect(dv1.bitcoinFormatted).toBe('1 010 101');

		const dv2 = getDisplayValues({
			satoshis: 1010101,
			denomination: EDenomination.classic,
		});

		// expected BTC conversion
		expect(dv2.bitcoinFormatted).toBe('0.01010101');
	});

	it('Blocktank FX rates with default selected currency', async () => {
		const res = await updateExchangeRates();

		expect(res.isOk()).toEqual(true);
		if (res.isErr()) {
			return;
		}

		const exchangeRates = getWalletStore().exchangeRates;

		const tickers = Object.keys(exchangeRates);

		//We have some available tickers
		expect(tickers.length).toBeGreaterThan(0);

		//All tickers have the correct format
		tickers.forEach((ticker) => {
			expect(typeof exchangeRates[ticker].currencySymbol).toBe('string');
			expect(typeof exchangeRates[ticker].quote).toBe('string');
			expect(typeof exchangeRates[ticker].quoteName).toBe('string');
			expect(typeof exchangeRates[ticker].rate).toBe('number');
			expect(exchangeRates[ticker].rate).toBeGreaterThan(1);
		});
	});

	it('Formats all display values in USD formatted with correct locale', () => {
		//Testing the react hook
		const dv = getDisplayValues({
			satoshis: 1010101,
			exchangeRate: 100000,
			currency: 'USD',
			locale: 'en-US',
		});

		expect(dv.fiatFormatted).toBe('1,010.10');
		expect(dv.fiatWhole).toBe('1,010');
		expect(dv.fiatDecimal).toBe('10');
		expect(dv.fiatDecimalSymbol).toBe('.');
		expect(dv.fiatSymbol).toBe('$');
		expect(dv.fiatTicker).toBe('USD');
		expect(dv.fiatValue).toBe(1010.101);
		expect(dv.bitcoinFormatted).toBe('1 010 101');
	});

	it('Formats all display values in RUB formatted with correct locale', () => {
		//Testing the react hook
		const dv = getDisplayValues({
			satoshis: 1010101,
			exchangeRate: 100000,
			currency: 'RUB',
			currencySymbol: '₽',
			locale: 'en-US',
		});

		expect(dv.fiatFormatted).toBe('1,010.10');
		expect(dv.fiatWhole).toBe('1,010');
		expect(dv.fiatDecimal).toBe('10');
		expect(dv.fiatDecimalSymbol).toBe('.');
		expect(dv.fiatSymbol).toBe('₽');
		expect(dv.fiatTicker).toBe('RUB');
		expect(dv.fiatValue).toBe(1010.101);
		expect(dv.bitcoinFormatted).toBe('1 010 101');
	});

	it('Can convert small amount of sats without scientific notation', () => {
		const dv = getDisplayValues({ satoshis: 10 });
		expect(dv.bitcoinFormatted).toBe('10');
		expect(dv.bitcoinWhole).toBe('10');
		expect(dv.bitcoinDecimal).toBe(undefined);
	});

	it('Can format to classic Bitcoin denomination', () => {
		const dv = getDisplayValues({
			satoshis: 123456789,
			denomination: EDenomination.classic,
		});
		expect(dv.bitcoinFormatted).toBe('1.23456789');
		expect(dv.bitcoinWhole).toBe('1');
		expect(dv.bitcoinDecimal).toBe('23456789');
	});
});

describe('convertToSats', () => {
	describe('can work with exchange rates', () => {
		beforeAll(async () => {
			const res = await updateExchangeRates();
			if (res.isErr()) {
				throw res.error;
			}
		});

		it('can convert fiat to sats', () => {
			const r1 = convertToSats(500, EConversionUnit.fiat);
			expect(r1).toBe(1000000);
			dispatch(updateSettings({ denomination: EDenomination.classic }));
			const r2 = convertToSats(500, EConversionUnit.fiat);
			expect(r2).toBe(1000000);
			resetSettingsState();
		});

		it('can convert sats to sats', () => {
			const r = convertToSats(10, EConversionUnit.satoshi);
			expect(r).toBe(10);
		});

		it('can convert BTC to sats', () => {
			const r = convertToSats(0.000005, EConversionUnit.BTC);
			expect(r).toBe(500);
		});
	});

	describe('can work without exchange rates', () => {
		beforeAll(() => dispatch(resetExchangeRates()));

		it('can convert fiat to sats', () => {
			const r1 = convertToSats(500, EConversionUnit.fiat);
			expect(r1).toBe(0);
			dispatch(updateSettings({ denomination: EDenomination.classic }));
			const r2 = convertToSats(500, EConversionUnit.fiat);
			expect(r2).toBe(0);
			resetSettingsState();
		});

		it('can convert sats to sats', () => {
			const r = convertToSats(500, EConversionUnit.satoshi);
			expect(r).toBe(500);
		});

		it('can convert BTC to sats', () => {
			const r = convertToSats(0.000005, EConversionUnit.BTC);
			expect(r).toBe(500);
		});
	});
});
