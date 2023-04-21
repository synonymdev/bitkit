// Fix 'getDispatch is not a function'
import '../src/store/actions/ui';
import { handleNumberPadPress } from '../src/utils/numberpad';

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
