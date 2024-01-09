import {
	removeKeysFromObject,
	reduceValue,
	timeAgo,
	isObjPartialMatch,
	ellipsis,
	generateCalendar,
} from '../src/utils/helpers';

describe('removeKeysFromObject', () => {
	it('takes a string, removes a single key from the object and returns the result', () => {
		const input = {
			a: '1',
			b: '2',
			c: '3',
		};

		const expected = {
			a: '1',
			c: '3',
		};

		const result = removeKeysFromObject(input, 'b');
		expect(result).toEqual(expected);
	});

	it('takes an array of strings, removes multiple keys from the object and returns the result', () => {
		const input = {
			a: '1',
			b: '2',
			c: '3',
		};

		const expected = {
			c: '3',
		};

		const result = removeKeysFromObject(input, ['a', 'b']);
		expect(result).toEqual(expected);
	});
});

describe('reduceValue', () => {
	it('takes an array of objects, and sums all values pertaining to a specific key', () => {
		const input = [
			{
				a: 1,
				b: 2,
			},
			{
				a: 4,
				b: 5,
			},
		];

		const expected = { value: 7 };
		const result = reduceValue(input, 'b');
		expect(result).toEqual(expected);
	});

	it('works with optional values', () => {
		const input = [
			{
				a: 1,
				b: 2,
			},
			{
				b: 5,
			},
		];

		const expected = { value: 1 };
		const result = reduceValue(input, 'a');
		expect(result).toEqual(expected);
	});

	it('returns an error where the lookup value is not a number', () => {
		const input = [
			{
				a: 1,
				b: 2,
			},
			{
				a: 'string1',
				b: 'string2',
			},
		];

		const result = reduceValue(input, 'a');
		expect(result).toHaveProperty('error');
	});
});

describe('timeAgo', () => {
	it('can format time', () => {
		expect(timeAgo(+new Date())).toEqual('now');
		expect(timeAgo(+new Date() - 1000 * 10)).toEqual('10 seconds ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 10)).toEqual('10 minutes ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 5)).toEqual('5 hours ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 24)).toEqual('yesterday');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 24 * 2)).toEqual(
			'2 days ago',
		);
		expect(timeAgo(1)).toEqual('January 1, 1970');

		// do not run this test before January 10th
		if (new Date().getMonth() === 0 && new Date().getDate() <= 10) {
			return;
		}
		expect(timeAgo(+new Date(new Date().getFullYear() - 1, 0, 1))).toEqual(
			'January 1 at 12:00 AM',
		);
	});
});

describe('ellipsis', () => {
	it('properly truncates strings using three dots in the middle of the string', () => {
		const s = '1234567890';
		expect(ellipsis(s, -1)).toEqual('1234567890');
		expect(ellipsis(s, 0)).toEqual('1234567890');
		expect(ellipsis(s, 1)).toEqual('1...');
		expect(ellipsis(s, 2)).toEqual('1...0');
		expect(ellipsis(s, 3)).toEqual('1...90');
		expect(ellipsis(s, 4)).toEqual('12...90');
		expect(ellipsis(s, 5)).toEqual('12...890');
		expect(ellipsis(s, 6)).toEqual('123...890');
		expect(ellipsis(s, 7)).toEqual('123...7890');
		expect(ellipsis(s, 8)).toEqual('1234...7890');
		expect(ellipsis(s, 9)).toEqual('1234...67890');
		expect(ellipsis(s, 10)).toEqual('1234567890');
		expect(ellipsis(s, 11)).toEqual('1234567890');
	});
});

describe('isObjPartialMatch', () => {
	it('can perform match', () => {
		const f = isObjPartialMatch;
		expect(f({}, {})).toEqual(true);
		expect(f({}, { a: 1 })).toEqual(true);
		expect(f({ a: 1 }, {})).toEqual(false);
		expect(f({ a: 1 }, {}, ['a'])).toEqual(false);
		expect(f({ a: { b: 2 } }, { a: { c: 3 } }, ['a'])).toEqual(true);

		expect(f({ a: { b: 2 } }, { a: { b: 1 } })).toEqual(true);
		expect(f({ a: { c: 1 } }, { a: { b: 1 } })).toEqual(false);

		expect(f({ a: 1 }, { a: [] })).toEqual(true);
	});
});

describe('calendar', () => {
	it('can generate calendar', () => {
		const date = new Date(Date.UTC(2020, 11, 31, 23, 59, 59));

		// december, week starts from monday
		const ruUtc = generateCalendar(date, 'ru-RU', 'UTC');
		expect(ruUtc).toEqual({
			weeks: [
				[null, 1, 2, 3, 4, 5, 6],
				[7, 8, 9, 10, 11, 12, 13],
				[14, 15, 16, 17, 18, 19, 20],
				[21, 22, 23, 24, 25, 26, 27],
				[28, 29, 30, 31, null, null, null],
			],
			weekDays: [1, 2, 3, 4, 5, 6, 7],
		});

		// december, week starts from sunday
		const usUtc = generateCalendar(date, 'en-US', 'UTC');
		expect(usUtc).toEqual({
			weeks: [
				[null, null, 1, 2, 3, 4, 5],
				[6, 7, 8, 9, 10, 11, 12],
				[13, 14, 15, 16, 17, 18, 19],
				[20, 21, 22, 23, 24, 25, 26],
				[27, 28, 29, 30, 31, null, null],
			],
			weekDays: [7, 1, 2, 3, 4, 5, 6],
		});

		// january, week starts from monday
		const ruMoscow = generateCalendar(date, 'ru-RU', 'Europe/Moscow');
		expect(ruMoscow).toEqual({
			weeks: [
				[null, null, null, null, 1, 2, 3],
				[4, 5, 6, 7, 8, 9, 10],
				[11, 12, 13, 14, 15, 16, 17],
				[18, 19, 20, 21, 22, 23, 24],
				[25, 26, 27, 28, 29, 30, 31],
			],
			weekDays: [1, 2, 3, 4, 5, 6, 7],
		});

		// january, week starts from sunday
		const usMoscow = generateCalendar(date, 'en-US', 'Europe/Moscow');
		expect(usMoscow).toEqual({
			weeks: [
				[null, null, null, null, null, 1, 2],
				[3, 4, 5, 6, 7, 8, 9],
				[10, 11, 12, 13, 14, 15, 16],
				[17, 18, 19, 20, 21, 22, 23],
				[24, 25, 26, 27, 28, 29, 30],
				[31, null, null, null, null, null, null],
			],
			weekDays: [7, 1, 2, 3, 4, 5, 6],
		});
	});
});
