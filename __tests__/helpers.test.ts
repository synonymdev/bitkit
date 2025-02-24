import {
	removeKeysFromObject,
	reduceValue,
	timeAgo,
	isObjPartialMatch,
	deepCompareStructure,
	ellipsis,
	generateCalendar,
	getDurationForBlocks,
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
		expect(timeAgo(+new Date(new Date().getFullYear(), 0, 1))).toEqual(
			'January 1 at 12:00 AM',
		);
	});
});

describe('getDurationForBlocks', () => {
	it('return human readable duration for number of blocks', () => {
		expect(getDurationForBlocks(1)).toEqual('10m');
		expect(getDurationForBlocks(6)).toEqual('60m');
		expect(getDurationForBlocks(7)).toEqual('1h');
		expect(getDurationForBlocks(25)).toEqual('4h');
		expect(getDurationForBlocks(144)).toEqual('1 days');
		expect(getDurationForBlocks(2016)).toEqual('14 days');
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

describe('deepCompareStructure', () => {
	it('can perform match', () => {
		const f = deepCompareStructure;
		expect(f({}, {})).toEqual(true);
		expect(f({}, [])).toEqual(false);
		expect(f({ a: 1 }, {})).toEqual(false);
		expect(f({ a: 1 }, { a: 2 })).toEqual(true);
		expect(f({ a: 1 }, { b: 1 })).toEqual(false);
		expect(f({ a: { b: 1 } }, { a: { b: 2 } })).toEqual(true);
		expect(f({ a: { b: 1 } }, { a: { c: 1 } })).toEqual(false);
		expect(f({ a: 1 }, { a: [] })).toEqual(false);
		expect(f({ a: { b: [] } }, { a: { b: [] } })).toEqual(true);
		expect(f({ a: { b: 1 } }, { a: { b: [] } })).toEqual(false);

		const received = {
			boostedTransactions: {
				bitcoin: {},
				bitcoinTestnet: {},
				bitcoinRegtest: {
					fff9398e30329ab0d4ae227c017b9c11537d6fadede4df402d3ae9bb854816f5: {
						parentTransactions: [
							'fff9398e30329ab0d4ae227c017b9c11537d6fadede4df402d3ae9bb854816f5',
						],
						childTransaction:
							'ee459c02101cad9dbab8d0fc2fe55026130e7db4d88ca8892b9003167c787fa1',
						type: 'cpfp',
						fee: 664,
					},
					'415098a69d7b1c93b31b14625c4b7663a4bdeee5f15c5982083ac1c4ec14717b': {
						parentTransactions: [
							'415098a69d7b1c93b31b14625c4b7663a4bdeee5f15c5982083ac1c4ec14717b',
						],
						childTransaction:
							'f7f0d6184818a9588633be608dc4d8f3510708c5946bea330c663a0bf8c334a2',
						type: 'cpfp',
						fee: 664,
					},
				},
			},
			transfers: {
				bitcoin: [],
				bitcoinTestnet: [],
				bitcoinRegtest: [
					{
						txId: '67a7108cd434d8580a0295517df0c740b59e84e875284ac139717e4dda4da0f8',
						type: 'open',
						status: 'pending',
						orderId: '5f95e1f5-26f9-4fb2-82e6-9ae602764d3b',
						amount: 17602,
					},
				],
			},
		};

		const expected = {
			boostedTransactions: {
				bitcoin: {},
				bitcoinTestnet: {},
				bitcoinRegtest: {},
			},
			transfers: {
				bitcoin: [],
				bitcoinTestnet: [],
				bitcoinRegtest: [],
			},
		};

		expect(f(received, expected, 1)).toEqual(true);
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
