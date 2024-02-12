import '../src/utils/i18n';
import { getWalletStore } from '../src/store/helpers';
import { updateExchangeRates } from '../src/store/actions/wallet';
import { getDisplayValues } from '../src/utils/displayValues';
import { resetExchangeRates } from '../src/store/actions/wallet';
import { EDenomination } from '../src/store/types/wallet';

// @ts-ignore
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				tickers: [
					{
						symbol: 'BTCRUB',
						lastPrice: '3832499',
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
						lastPrice: '42373.00',
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
	jest.setTimeout(10000);

	beforeAll(() => resetExchangeRates());

	it('handles missing exchange rate by returning the correct fiat fallback', () => {
		const dv = getDisplayValues({ satoshis: 1010101 });

		// expected fiat fallback
		expect(dv.fiatFormatted).toBe('—');
		expect(dv.fiatWhole).toBe('—');
		expect(dv.fiatDecimal).toBe('');
		expect(dv.fiatDecimalSymbol).toBe('');
		expect(dv.fiatSymbol).toBe('$');
		expect(dv.fiatTicker).toBe('USD');
		expect(dv.fiatValue).toBe(0);

		// expected BTC conversion
		expect(dv.bitcoinFormatted).toBe('1 010 101');
	});

	it('Blocktank FX rates with default selected currency', async () => {
		const res = await updateExchangeRates({});

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
