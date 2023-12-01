import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	bitcoinURL,
	checkComplete,
	completeOnboarding,
	launchAndWait,
	markComplete,
	sleep,
	electrumHost,
	electrumPort,
} from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

const __DEV__ = process.env.DEV === 'true';
const d = checkComplete('slash-1') ? describe.skip : describe;

// private key: rhuoi5upr3he3d5p9ef685bnxq8adbariwphg7i8gxdnnazok87xtc3e15pkouxizbzm6m4kjaoi9bndwp88iefycf6i6qhqu1ifzfa
const satoshi = {
	name: 'Satoshi Nakamoto',
	url: 'slash:9n31tfs4ibg9mqdqzhzwwutbm6nr8e4qxkokyam7mh7a78fkmqmo/profile.json?relay=https://dht-relay.synonym.to/staging/web-relay',
	bio: "Satoshi Nakamoto: Enigmatic genius behind Bitcoin's creation and originator's identity unknown.",
	website: 'bitcoin.org',
	email: 'satoshin@gmx.com',
};

// private key: nsttdkefgy5ta1wkcbn757eaxgcchxzxp9y7yrgd88ynkm733mscy7761757t95ejzptcgfq468mhe5f4uqff1xw3utgm7g9gekhj7y
const hal = {
	name1: 'Hal',
	name2: 'Finney',
	url: 'slash:ab557f5z5d9souq5nack7ihqzatsmighkmr9ju8ncz4p6coiau4y/profile.json?relay=https://dht-relay.synonym.to/staging/web-relay',
};

d('Profile and Contacts', () => {
	let waitForElectrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		await completeOnboarding();

		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}

		waitForElectrum = await initWaitForElectrumToSync(
			{ host: electrumHost, port: electrumPort },
			bitcoinURL,
		);
	});

	beforeEach(async () => {
		await launchAndWait();
		await waitForElectrum();
	});

	afterEach(() => {
		waitForElectrum?.close();
	});

	d('Slashtags', () => {
		// Test plan
		// - create new profile
		// - edit profile
		// - add a few contacts
		// - filter contacts
		// - remove contact
		// - receive money and attach contact to the transaction
		// - backup and restore wallet from the seed
		// - check that everything is in place

		it('Can manage Slashtags Profile', async () => {
			if (checkComplete('slash-1')) {
				return;
			}

			// CREATE NEW PROFILE
			await element(by.id('Header')).tap();
			await element(by.id('OnboardingContinue')).tap();
			await element(by.id('NameInput')).typeText('TestName');
			await element(by.id('BioInput')).typeText('Testing Bitkit for sats');
			await element(by.id('ProfileAddLink')).tap();

			await element(by.id('LinkLabelInput')).typeText('LINK-LABEL');
			await element(by.id('LinkValueInput')).typeText('link-value');
			await element(by.id('SaveLink')).tap();
			await waitFor(element(by.id('SaveLink'))).not.toBeVisible();
			await expect(element(by.text('LINK-LABEL'))).toExist();
			await expect(element(by.text('link-value'))).toExist();

			await element(by.id('ProfileAddLink')).tap();
			await element(by.id('ProfileLinkSuggestions')).tap();
			await element(by.text('Email')).tap();
			await element(by.id('LinkValueInput')).typeText('some@email.value');
			await element(by.id('SaveLink')).tap();
			await waitFor(element(by.id('SaveLink'))).not.toBeVisible();
			await expect(element(by.text('EMAIL'))).toExist();
			await expect(element(by.text('mailto:some@email.value'))).toExist();

			await element(by.id('ProfileSaveButton')).tap();
			await element(by.id('OnboardingContinue')).tap();
			await expect(element(by.text('TestName'))).toExist();
			await expect(element(by.text('Testing Bitkit for sats'))).toExist();
			await element(by.id('CopyButton')).tap();
			const { label: slashtagsUrl } = await element(
				by.id('ProfileSlashtag'),
			).getAttributes();

			// EDIT PROFILE
			await element(by.id('EditButton')).tap();
			await element(by.id('NameInput')).replaceText('NewTestName');
			await element(by.id('BioInput')).replaceText('Still testing Bitkit');
			await element(by.id('BioInput')).tapReturnKey();
			await element(by.id('RemoveLinkButton')).atIndex(0).tap();
			await element(by.id('ProfileSaveButton')).tap();
			await expect(element(by.text('NewTestName'))).toExist();
			await expect(element(by.text('Still testing Bitkit'))).toExist();

			await element(by.id('DetailsButton')).tap();
			await expect(element(by.text('some@email.value'))).toExist();
			await expect(element(by.text('link-value'))).not.toExist();
			await element(by.id('NavigationClose')).tap();

			// ADD CONTACTS
			await element(by.id('HeaderContactsButton')).tap();
			await element(by.id('ContactsOnboardingButton')).tap();

			// self
			await element(by.id('AddContact')).tap();
			await element(by.id('ContactURLInput')).typeText(slashtagsUrl);
			await element(by.id('AddContactButton')).tap();
			await expect(element(by.id('ContactURLInput-error'))).toBeVisible();

			// Satoshi
			await element(by.id('ContactURLInput')).replaceText(satoshi.url);
			await element(by.id('AddContactButton')).tap();
			await waitFor(element(by.id('NameInput')))
				.toBeVisible()
				.withTimeout(30000);
			await expect(element(by.text(satoshi.name))).toExist();
			await expect(element(by.text(satoshi.bio))).toExist();
			await element(by.id('SaveContactButton')).tap();
			await expect(element(by.text('WEBSITE'))).toExist();
			await expect(element(by.text(satoshi.website))).toExist();
			await element(by.id('NavigationBack')).tap();

			if (!__DEV__) {
				// FIXME: this bottom sheet should not appear
				await element(by.id('AddContactNote')).swipe('down');
			}

			// Hal
			await element(by.id('AddContact')).tap();
			await element(by.id('ContactURLInput')).typeText(hal.url);
			await element(by.id('AddContactButton')).tap();
			await waitFor(element(by.id('NameInput')))
				.toBeVisible()
				.withTimeout(30000);
			await expect(element(by.text(hal.name1))).toExist();
			await element(by.id('NameInput')).replaceText(hal.name2);
			await element(by.id('SaveContactButton')).tap();
			await expect(element(by.text(hal.name2))).toExist();
			await element(by.id('NavigationClose')).tap();

			// FILTER CONTACTS
			await element(by.id('HeaderContactsButton')).tap();
			await expect(element(by.text(satoshi.name))).toBeVisible();
			await expect(element(by.text(hal.name2))).toBeVisible();
			await element(by.id('ContactsSearchInput')).typeText('Satoshi\n');
			await expect(element(by.text(satoshi.name))).toBeVisible();
			await expect(element(by.text(hal.name2))).not.toBeVisible();
			await element(by.id('ContactsSearchInput')).replaceText('Finn\n');
			await element(by.id('ContactsSearchInput')).tapReturnKey();
			await expect(element(by.text(satoshi.name))).not.toBeVisible();
			await expect(element(by.text(hal.name2))).toBeVisible();

			// REMOVE CONTACT
			await element(by.text(hal.name2)).tap();
			await element(by.id('DeleteContactButton')).tap();
			await element(by.id('DialogConfirm')).tap();
			await expect(element(by.text(hal.name2))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			// RECEIVE MONEY AND ATTACH CONTACT TO THE TRANSACTION
			await element(by.id('Receive')).tap();
			await element(by.id('UnderstoodButton')).tap();
			await sleep(1000);
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');
			await rpc.sendToAddress(wAddress, '1');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await waitForElectrum();
			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down');
			await element(by.id('BitcoinAsset')).tap();
			await element(by.id('Activity-1')).tap();
			await element(by.id('ActivityAssign')).tap();
			await element(by.text(satoshi.name)).tap();
			await element(by.id('ActivityDetach')).tap();
			await element(by.id('ActivityAssign')).tap();
			await element(by.text(satoshi.name)).tap();
			await expect(
				element(by.text(satoshi.name).withAncestor(by.id('ContactSmall'))),
			).toBeVisible();
			await element(by.id('NavigationClose')).tap();
			// give it time to perform the metadata backup
			await sleep(5000);

			// GET SEED
			await element(by.id('Settings')).tap();
			await element(by.id('BackupSettings')).tap();
			await element(by.id('BackupWallet')).tap();
			await element(by.id('TapToReveal')).tap();
			const { label: seed } = await element(
				by.id('SeedContaider'),
			).getAttributes();
			await element(by.id('SeedContaider')).swipe('down');
			console.info('seed: ', seed);

			// WIPE APP AND RESTORE FROM THE SEED
			await device.launchApp({ delete: true });

			await waitFor(element(by.id('Check1'))).toBeVisible();
			await element(by.id('Check1')).tap();
			await element(by.id('Check2')).tap();
			await element(by.id('Continue')).tap();
			await waitFor(element(by.id('SkipIntro'))).toBeVisible();
			await element(by.id('SkipIntro')).tap();
			await element(by.id('RestoreWallet')).tap();
			await element(by.id('MultipleButton')).tap();
			await element(by.id('Word-0')).replaceText(seed);
			await element(by.id('WordIndex-4')).swipe('up');
			await element(by.id('RestoreButton')).tap();

			await waitFor(element(by.id('GetStartedButton')))
				.toBeVisible()
				.withTimeout(300000); // 5 min
			await element(by.id('GetStartedButton')).tap();

			// wait for AssetsTitle to appear and be accessible
			for (let i = 0; i < 60; i++) {
				await sleep(1000);
				try {
					await element(by.id('AssetsTitle')).tap();
					break;
				} catch (e) {}
			}

			// CHECK PROFILE, CONTACTS, TRANSACTION
			await waitFor(element(by.text('NewTestName')))
				.toBeVisible()
				.withTimeout(60000);

			await element(by.id('HeaderContactsButton')).tap();
			await expect(element(by.text(satoshi.name))).toBeVisible();
			await element(by.id('NavigationClose')).tap();

			await element(by.id('BitcoinAsset')).tap();
			await element(by.id('Activity-1')).tap();
			await expect(
				element(by.text(satoshi.name).withAncestor(by.id('ContactSmall'))),
			).toBeVisible();

			markComplete('slash-1');
		});
	});
});
