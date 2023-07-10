import { checkComplete, markComplete } from './helpers';

d = checkComplete('newwallet-1') ? describe.skip : describe;

d('New Wallet', () => {
	beforeAll(async () => {
		await device.launchApp();
	});

	it('should create new wallet', async () => {
		if (checkComplete('newwallet-1')) {
			return;
		}

		// TOS and PP
		await waitFor(element(by.id('Check1'))).toBeVisible();

		await element(by.id('Check1')).tap();
		await element(by.id('Check2')).tap();
		await element(by.id('Continue')).tap();

		await element(by.id('SkipIntro')).tap();
		await element(by.id('NewWallet')).tap();

		// wat for wallet to be created
		await waitFor(element(by.id('ToGetStartedClose'))).toBeVisible();
		markComplete('newwallet-1');
	});
});
