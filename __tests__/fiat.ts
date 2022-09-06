import { getStore } from '../src/store/helpers';
import { updateExchangeRates } from '../src/store/actions/wallet';
import { getDisplayValues } from '../src/utils/exchange-rate';
import { resetExchangeRates } from '../src/store/actions/wallet';

global.fetch = require('node-fetch');

describe('Pulls latest fiat exchange rates and checks the wallet store for valid conversions', () => {
	jest.setTimeout(10000);

	beforeAll(() => resetExchangeRates());

	it('handles missing exchange rate by returning the correct fiat fallback', () => {
		const dv = getDisplayValues({
			satoshis: 1010101,
			bitcoinUnit: 'mBTC',
		});

		// expected fiat fallback
		expect(dv.fiatFormatted).toBe('—');
		expect(dv.fiatWhole).toBe('—');
		expect(dv.fiatDecimal).toBe('');
		expect(dv.fiatDecimalValue).toBe('');
		expect(dv.fiatSymbol).toBe('$');
		expect(dv.fiatTicker).toBe('USD');
		expect(dv.fiatValue).toBe(0);

		// expected mBTC conversion
		expect(dv.bitcoinFormatted).toBe('10.10101000');
		expect(dv.bitcoinSymbol).toBe('m₿');
		expect(dv.bitcoinTicker).toBe('mBTC');
		expect(dv.satoshis).toBe(1010101);
	});

	it('Blocktank FX rates with default selected currency', async () => {
		const res = await updateExchangeRates();

		expect(res.isOk()).toEqual(true);
		if (res.isErr()) {
			return;
		}

		const { exchangeRates } = getStore().wallet;

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
			bitcoinUnit: 'BTC',
			locale: 'en-US',
		});

		expect(dv.fiatFormatted).toBe('1,010.10');
		expect(dv.fiatWhole).toBe('1,010');
		expect(dv.fiatDecimal).toBe('.');
		expect(dv.fiatDecimalValue).toBe('10');
		expect(dv.fiatSymbol).toBe('$');
		expect(dv.fiatTicker).toBe('USD');
		expect(dv.fiatValue).toBe(1010.1);
		expect(dv.bitcoinFormatted).toBe('0.01010101');
		expect(dv.bitcoinSymbol).toBe('₿');
		expect(dv.bitcoinTicker).toBe('BTC');
		expect(dv.satoshis).toBe(1010101);
	});

	it('Formats all display values in RUB formatted with correct locale', () => {
		//Testing the react hook
		const dv = getDisplayValues({
			satoshis: 1010101,
			exchangeRate: 100000,
			currency: 'RUB',
			currencySymbol: '₽',
			bitcoinUnit: 'satoshi',
			locale: 'en-US',
		});

		expect(dv.fiatFormatted).toBe('1,010.10');
		expect(dv.fiatWhole).toBe('1,010');
		expect(dv.fiatDecimal).toBe('.');
		expect(dv.fiatDecimalValue).toBe('10');
		expect(dv.fiatSymbol).toBe('₽');
		expect(dv.fiatTicker).toBe('RUB');
		expect(dv.fiatValue).toBe(1010.1);
		expect(dv.bitcoinFormatted).toBe('1 010 101');
		expect(dv.bitcoinSymbol).toBe('⚡');
		expect(dv.bitcoinTicker).toBe('sats');
		expect(dv.satoshis).toBe(1010101);
	});
});
