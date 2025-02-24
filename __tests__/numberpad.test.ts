import '../src/store/utils/ui';
import { resetExchangeRates } from '../src/store/slices/wallet';
import { updateExchangeRates } from '../src/store/actions/wallet';
import { EDenomination, EUnit } from '../src/store/types/wallet';
import { getNumberPadText, handleNumberPadPress } from '../src/utils/numberpad';
import { dispatch } from '../src/store/helpers';

// @ts-ignore
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				tickers: [
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

describe('Receive/Send NumberPad', () => {
	it('can add a character', () => {
		const current = '';
		const input = '1';
		const expected = '1';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});

	it('can delete a character', () => {
		const current = '1.23';
		const input = 'delete';
		const expected = '1.2';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});

	it('limits to maxLength', () => {
		const current = '123';
		const input = '4';
		const expected = '123';

		const result = handleNumberPadPress(input, current, { maxLength: 3 });
		expect(result).toEqual(expected);
	});

	it('limits to maxDecimals', () => {
		const current = '1.23';
		const input = '4';
		const expected = '1.23';

		const result = handleNumberPadPress(input, current, { maxDecimals: 2 });
		expect(result).toEqual(expected);
	});

	it('no leading (integer) zeros (01.23 -> 1.23)', () => {
		const current = '0';
		const input = '1';
		const expected = '1';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});

	it('no multiple zeros (00.23 -> 0.23)', () => {
		const current = '0';
		const input = '0';
		const expected = '0';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});

	it('no multiple decimal symbols (0..23 -> 0.23)', () => {
		const current = '0.';
		const input = '.';
		const expected = '0.';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});

	it('adds a leading zero (.23 -> 0.23)', () => {
		const current = '';
		const input = '.';
		const expected = '0.';

		const result = handleNumberPadPress(input, current);
		expect(result).toEqual(expected);
	});
});

describe('getNumberPadText', () => {
	describe('can work without exchange rates', () => {
		beforeAll(() => dispatch(resetExchangeRates()));

		it('can convert to BTC with classic denomination', () => {
			const r = getNumberPadText(100000, EDenomination.classic, EUnit.BTC);
			expect(r).toEqual('0.001');
		});
	});

	describe('with exchange rates', () => {
		beforeAll(async () => {
			const r = await updateExchangeRates({});
			if (r.isErr()) {
				throw r.error;
			}
		});

		it('if amount is 0, return empty string', () => {
			const r = getNumberPadText(0, EDenomination.classic, EUnit.BTC);
			expect(r).toEqual('');
		});

		it('can convert to BTC with classic denomination', () => {
			const r = getNumberPadText(100000, EDenomination.classic, EUnit.BTC);
			expect(r).toEqual('0.001');
		});

		it('can convert to BTC with modern denomination', () => {
			const r = getNumberPadText(100000, EDenomination.modern, EUnit.BTC);
			expect(r).toEqual('100000');
		});

		it('can convert to FIAT with classic denomination', () => {
			const r = getNumberPadText(100000, EDenomination.classic, EUnit.fiat);
			expect(r).toEqual('50');
		});

		it('can convert to FIAT with modern denomination', () => {
			const r = getNumberPadText(100000, EDenomination.classic, EUnit.fiat);
			expect(r).toEqual('50');
		});

		it('can round FIAT value', () => {
			const r1 = getNumberPadText(
				33333,
				EDenomination.classic,
				EUnit.fiat,
				false,
			);
			expect(r1).toEqual('16.6665');
			const r2 = getNumberPadText(
				33333,
				EDenomination.classic,
				EUnit.fiat,
				true,
			);
			expect(r2).toEqual('17');
		});
	});
});
