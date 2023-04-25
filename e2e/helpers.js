import fs from 'fs';
import path from 'path';

const LOCK_PATH = '/tmp/';

export const checkComplete = (name) => {
	if (!process.env.CI) {
		return;
	}

	if (fs.existsSync(path.join(LOCK_PATH, 'lock-' + name))) {
		console.warn('skipping', name, 'as it previously passed on CI');
		return true;
	}

	return false;
};

export const markComplete = (name) => {
	if (!process.env.CI) {
		return;
	}

	fs.writeFileSync(path.join(LOCK_PATH, 'lock-' + name), '1');
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isButtonEnabled = async (element) => {
	try {
		await expect(element).tap();
		return true;
	} catch (e) {
		return false;
	}
};

export const completeOnboarding = async () => {
	await device.launchApp();

	// TOS and PP
	await waitFor(element(by.id('Check1'))).toBeVisible();

	await element(by.id('Check1')).tap();
	await element(by.id('Check2')).tap();
	await element(by.id('Continue')).tap();

	await waitFor(element(by.id('SkipIntro'))).toBeVisible();
	await element(by.id('SkipIntro')).tap();
	await element(by.id('NewWallet')).tap();

	// wait for wallet to be created
	await waitFor(element(by.id('ToGetStartedClose'))).toBeVisible();
	await sleep(1000); // take app some time to load

	// repeat 60 times before fail
	for (let i = 0; i < 60; i++) {
		await sleep(1000);
		try {
			await element(by.id('ToGetStartedClose')).tap();
			await sleep(3000); // wait for redux-persist to save state
			return;
		} catch (e) {}
	}

	throw new Error('Tapping "ToGetStartedClose" timeout');
};

export const launchAndWait = async () => {
	await sleep(1000);
	await device.launchApp({
		newInstance: true,
		permissions: { faceid: 'YES' },
	});

	// wait for AssetsTitle to appear and be accessible
	for (let i = 0; i < 60; i++) {
		try {
			await element(by.id('AssetsTitle')).tap();
			await sleep(1000);
			break;
		} catch (e) {
			continue;
		}
	}
};
