import jestExpect from 'expect';

import { sleep, checkComplete, markComplete } from './helpers';

d = checkComplete('onboarding-1') ? describe.skip : describe;

d('Onboarding', () => {
	it('Can pass onboarding correctly', async () => {
		if (checkComplete('onboarding-1')) {
			return;
		}

		// Test plan
		// - can view TOS
		// - can swipe onboarding
		// - can skip onboarding
		// - can restore wallet with passphrase

		await device.launchApp();

		// TOS and PP
		await waitFor(element(by.id('Check1'))).toBeVisible();
		await element(by.id('Check1')).tap();
		await element(by.id('Check2')).tap();
		await element(by.id('Continue')).tap();
		await element(by.id('GetStarted')).tap();
		await element(by.id('Slide0')).swipe('left');
		await element(by.id('Slide1')).swipe('left');
		await element(by.id('Slide2')).swipe('left');
		await element(by.id('Slide3')).swipe('right');
		await element(by.id('SkipButton')).tap();

		// create new wallet with passphrase
		await element(by.id('Passphrase')).tap();
		await element(by.id('PassphraseInput')).typeText('supersecret');
		await element(by.id('PassphraseInput')).tapReturnKey();
		await element(by.id('CreateNewWallet')).tap();

		// wait for wallet to be created
		await waitFor(element(by.id('WalletOnboardingClose'))).toBeVisible();
		await sleep(1000); // take app some time to load

		// try for 3min before fail
		for (let i = 0; i < 180; i++) {
			await sleep(1000);
			try {
				await element(by.id('WalletOnboardingClose')).tap();
				await sleep(3000); // wait for redux-persist to save state
				break;
			} catch (e) {}

			if (i === 179) {
				throw new Error('Tapping "WalletOnboardingClose" timeout');
			}
		}

		// get seed
		await element(by.id('Settings')).tap();
		await element(by.id('BackupSettings')).tap();
		await element(by.id('BackupWallet')).tap();
		await element(by.id('TapToReveal')).tap();
		// get the seed from SeedContaider
		const { label: seed } = await element(
			by.id('SeedContaider'),
		).getAttributes();
		await element(by.id('SeedContaider')).swipe('down');
		await element(by.id('NavigationClose')).atIndex(0).tap();
		console.info('seed: ', seed);

		// get receing address
		await element(by.id('Receive')).tap();
		await waitFor(element(by.id('QRCode')))
			.toBeVisible()
			.withTimeout(30000);
		const { label: address1 } = await element(by.id('QRCode')).getAttributes();
		console.info('address', address1);

		// wipe and restore wallet
		await device.launchApp({ delete: true });

		await waitFor(element(by.id('Check1'))).toBeVisible();
		await element(by.id('Check1')).tap();
		await element(by.id('Check2')).tap();
		await element(by.id('Continue')).tap();
		await waitFor(element(by.id('SkipIntro'))).toBeVisible();
		await element(by.id('SkipIntro')).tap();
		await element(by.id('RestoreWallet')).tap();
		await element(by.id('MultipleDevices-button')).tap();
		await element(by.id('Word-0')).replaceText(seed);
		await element(by.id('WordIndex-4')).swipe('up');
		await element(by.id('AdvancedButton')).tap();
		await element(by.id('PassphraseInput')).typeText('supersecret');
		await element(by.id('PassphraseInput')).tapReturnKey();
		await element(by.id('RestoreButton')).tap();

		await waitFor(element(by.id('GetStartedButton')))
			.toBeVisible()
			.withTimeout(300000); // 5 min
		await element(by.id('GetStartedButton')).tap();

		// wait for SuggestionsLabel to appear and be accessible
		for (let i = 0; i < 60; i++) {
			await sleep(1000);
			try {
				await element(by.id('SuggestionsLabel')).tap();
				break;
			} catch (e) {}
		}

		// get receing address
		await element(by.id('Receive')).tap();
		await waitFor(element(by.id('QRCode')))
			.toBeVisible()
			.withTimeout(30000);
		const { label: address2 } = await element(by.id('QRCode')).getAttributes();

		jestExpect(address1).toBe(address2);

		markComplete('onboarding-1');
	});
});
