import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	bitcoinURL,
	checkComplete,
	completeOnboarding,
	launchAndWait,
	markComplete,
	sleep,
	getSeed,
	restoreWallet,
} from './helpers';
import initElectrum from './electrum';

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
	let electrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		await completeOnboarding();

		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}

		electrum = await initElectrum();
	});

	beforeEach(async () => {
		await launchAndWait();
		await electrum?.waitForSync();
	});

	afterEach(() => {
		electrum?.stop();
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
		// - delete profile

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
			await expect(element(by.text('TESTNAME'))).toExist();
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
			await expect(element(by.text('NEWTESTNAME'))).toExist();
			await expect(element(by.text('Still testing Bitkit'))).toExist();
			await element(by.id('NavigationClose')).tap();

			// ADD CONTACTS
			await element(by.id('HeaderContactsButton')).tap();
			await element(by.id('ContactsOnboarding-button')).tap();

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
			await element(by.id('NavigationBack')).tap();

			if (device.getPlatform() === 'ios') {
				// FIXME: this bottom sheet should not appear
				// Tap on background to dismiss
				await element(by.label('Close')).atIndex(0).tap({ x: 10, y: 10 });
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
			await expect(element(by.text(hal.name2.toUpperCase()))).toExist();
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

			// RESTART APP
			await launchAndWait();

			await waitFor(element(by.text('NewTestName')))
				.toBeVisible()
				.withTimeout(60000);

			await element(by.id('HeaderContactsButton')).tap();
			// check un-edited contact
			await expect(element(by.text(satoshi.name))).toBeVisible();
			// check edited contact retains new name
			await expect(element(by.text(hal.name2))).toBeVisible();

			// REMOVE CONTACT
			await element(by.text(hal.name2)).tap();
			await element(by.id('DeleteContactButton')).tap();
			await element(by.id('DialogConfirm')).tap();
			await expect(element(by.text(hal.name2))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			// RECEIVE MONEY AND ATTACH CONTACT TO THE TRANSACTION
			await element(by.id('Receive')).tap();
			await sleep(1000);
			await waitFor(element(by.id('QRCode'))).toBeVisible();
			await sleep(100); // wait for qr code to render
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');
			await rpc.sendToAddress(wAddress, '1');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await electrum?.waitForSync();
			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down');
			await element(by.id('ActivitySavings')).tap();
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

			// WIPE APP AND RESTORE FROM THE SEED
			const seed = await getSeed();
			await restoreWallet(seed);

			// CHECK PROFILE, CONTACTS, TRANSACTION
			await waitFor(element(by.text('NewTestName')))
				.toBeVisible()
				.withTimeout(60000);

			await element(by.id('HeaderContactsButton')).tap();
			await expect(element(by.text(satoshi.name))).toBeVisible();
			await expect(element(by.text(hal.name1))).not.toBeVisible();
			await expect(element(by.text(hal.name2))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			await element(by.id('ActivitySavings')).tap();
			await element(by.id('Activity-1')).tap();
			await expect(
				element(by.text(satoshi.name).withAncestor(by.id('ContactSmall'))),
			).toBeVisible();

			// DELETE PROFILE
			await element(by.id('NavigationClose')).tap();
			await element(by.id('Header')).tap();
			await element(by.id('EditButton')).tap();
			await element(by.id('ProfileDeleteButton')).tap();
			await waitFor(element(by.id('DeleteDialog')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('DialogConfirm')).tap();
			await expect(element(by.id('EmptyProfileHeader'))).toBeVisible();
			await element(by.id('Header')).tap();
			await expect(element(by.id('OnboardingContinue'))).toBeVisible();

			markComplete('slash-1');
		});
	});
});
