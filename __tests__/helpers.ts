import { removeKeysFromObject, timeAgo, ellipsis } from '../src/utils/helpers';

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

describe('timeAgo', () => {
	it('cat format time', () => {
		expect(timeAgo(+new Date())).toEqual('now');
		expect(timeAgo(+new Date() - 1000 * 10)).toEqual('10 seconds ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 10)).toEqual('10 minutes ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 5)).toEqual('5 hours ago');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 24)).toEqual('yesterday');
		expect(timeAgo(+new Date() - 1000 * 60 * 60 * 24 * 2)).toEqual(
			'2 days ago',
		);
		expect(timeAgo(+new Date(new Date().getFullYear(), 0, 1))).toEqual(
			'January 1 at 12:00 AM',
		);
		expect(timeAgo(1)).toEqual('January 1, 1970');
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
