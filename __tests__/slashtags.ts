import { getNewProfileUrl } from '../src/utils/slashtags2';

describe('Slashtags', () => {
	it('profile url convert function woks', () => {
		expect(
			getNewProfileUrl(
				'slash:c7xk1b11o8k8jw6cn9a8asjcau77aenf7iq79tbc9u933wyoyjxy',
			),
		).toEqual(
			'slash:c7xk1b11o8k8jw6cn9a8asjcau77aenf7iq79tbc9u933wyoyjxy?relay=https://dht-relay.synonym.to/staging/web-relay',
		);
		expect(() => getNewProfileUrl('xxx')).toThrow(Error);
	});
});
