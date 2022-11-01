describe('New Wallet', () => {
	beforeAll(async () => {
		await device.launchApp();
	});

	beforeEach(async () => {
		await device.reloadReactNative();
	});

	it('should create new wallet', async () => {
		await expect(element(by.id('Check1'))).toBeVisible();
		await expect(element(by.id('Check2'))).toBeVisible();
		// await expect(element(by.id('GetStarted'))).toBeVisible();
		// await expect(element(by.id('SkipIntro'))).toBeVisible();
		// await element(by.id('SkipIntro')).tap();
		// await waitFor(element(by.id('NewWallet'))).toBeVisible();
		// await element(by.id('NewWallet')).tap();
		// await waitFor(element(by.id('EmptyWallet'))).toBeVisible();
	});
});
