// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('New Wallet', () => {
	beforeAll(async () => {
		await device.launchApp();
	});

	beforeEach(async () => {
		await device.reloadReactNative();
	});

	it('should create new wallet', async () => {
		// TOS and PP
		await waitFor(element(by.id('TestCheck1'))).toBeVisible();

		await element(by.id('TestCheck1')).tap();
		await element(by.id('TestCheck2')).tap();
		await element(by.id('TestContinue')).tap();

		await waitFor(element(by.id('TestSkipIntro'))).toBeVisible();
		await element(by.id('TestSkipIntro')).tap();
		await element(by.id('TestNewWallet')).tap();

		// wat for wallet to be created
		await waitFor(element(by.id('TestToGetStarted'))).toBeVisible();
	});
});
