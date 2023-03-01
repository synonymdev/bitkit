import { removeKeysFromObject, timeAgo } from '../src/utils/helpers';

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
