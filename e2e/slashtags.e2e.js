import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
} from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

const bitcoinURL =
	'http://electrumx:1VmSUVGBuLNWvZl0LExRDW0tvl6196-47RfXIzS384g=@localhost:43782';

describe('Profile and Contacts', () => {
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
			{ port: 60001, host: '127.0.0.1' },
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

	describe('Slashtags', () => {
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
			await element(by.id('NameInput')).replaceText('TestName');
			await element(by.id('BioInput')).replaceText('Tesing Bitkit for sats');
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
			await expect(element(by.text('some@email.value'))).toExist();

			await element(by.id('ProfileSaveButton')).tap();
			await element(by.id('OnboardingContinue')).tap();
			await expect(element(by.text('TestName'))).toExist();
			await expect(element(by.text('Tesing Bitkit for sats'))).toExist();
			await element(by.id('CopyButton')).tap();

			// EDIT PROFILE
			await element(by.id('EditButton')).tap();
			await element(by.id('NameInput')).replaceText('NewTestName');
			await element(by.id('BioInput')).replaceText('Still tesing Bitkit');
			await element(by.id('BioInput')).tapReturnKey();
			await element(by.id('RemoveLinkButton')).atIndex(0).tap();
			await element(by.id('ProfileSaveButton')).tap();
			await expect(element(by.text('NewTestName'))).toExist();
			await expect(element(by.text('Still tesing Bitkit'))).toExist();

			await element(by.id('DetailsButton')).tap();
			await expect(element(by.text('some@email.value'))).toExist();
			await expect(element(by.text('link-value'))).not.toExist();
			await element(by.id('NavigationClose')).atIndex(1).tap();

			// ADD CONTACTS
			await element(by.id('HeaderContactsButton')).tap();
			await element(by.id('ContactsOnboardingButton')).tap();
			await element(by.id('AddContact')).tap();

			// John
			await element(by.id('ContactURLInput')).replaceText(
				'slash:9uate7b6srfaur8stm5br7kencdz6km9xde46iph165d6isidssy',
			);
			// await waitFor(element(by.id('HourglassSpinner')))
			// 	.not.toBeVisible()
			// 	.withTimeout(30000);
			await waitFor(element(by.id('NameInput')))
				.toBeVisible()
				.withTimeout(30000);
			await expect(element(by.text('John Carvalho'))).toExist();
			await expect(element(by.text('Slashtags fixes this.'))).toExist();
			await element(by.id('SaveContactButton')).tap();
			await expect(element(by.text('WEBSITE'))).toExist();
			await expect(element(by.text('synonym.to'))).toExist();
			await element(by.id('NavigationBack')).atIndex(2).tap();

			// Corey
			await element(by.id('ContactURLInput')).replaceText(
				'slash:rhbmdu3wn7916nok3n8ui4d3wiua3rtisihqpzpeakuci55fa8yy',
			);
			// await waitFor(element(by.id('HourglassSpinner')))
			// 	.not.toBeVisible()
			// 	.withTimeout(30000);
			await waitFor(element(by.id('NameInput')))
				.toBeVisible()
				.withTimeout(30000);
			await expect(element(by.text('Corey'))).toExist();
			await element(by.id('NameInput')).replaceText('CoreyNewName');
			await element(by.id('SaveContactButton')).tap();
			await expect(element(by.text('CoreyNewName'))).toExist();
			await element(by.id('NavigationClose')).atIndex(2).tap();

			// FILTER CONTACTS
			await element(by.id('HeaderContactsButton')).tap();
			await expect(element(by.text('John Carvalho'))).toBeVisible();
			await expect(element(by.text('CoreyNewName'))).toBeVisible();
			await element(by.id('ContactsSearchInput')).typeText('John\n');
			await expect(element(by.text('John Carvalho'))).toBeVisible();
			await expect(element(by.text('CoreyNewName'))).not.toBeVisible();
			await element(by.id('ContactsSearchInput')).replaceText('Corey');
			await element(by.id('ContactsSearchInput')).tapReturnKey();
			await expect(element(by.text('John Carvalho'))).not.toBeVisible();
			await expect(element(by.text('CoreyNewName'))).toBeVisible();

			// REMOVE CONTACT
			await element(by.text('CoreyNewName')).tap();
			await element(by.id('DeleteContactButton')).tap();
			await element(by.id('DialogConfirm')).tap();
			await expect(element(by.text('CoreyNewName'))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			// RECEIVE MONEY AND ATTACH CONTACT TO THE TRANSACTION
			await element(by.id('Receive')).tap();
			await element(by.id('UnderstoodButton')).tap();
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
			await element(by.text('John Carvalho')).tap();
			await element(by.id('ActivityDetach')).tap();
			await element(by.id('ActivityAssign')).tap();
			await element(by.text('John Carvalho')).tap();
			await expect(
				element(by.text('John Carvalho').withAncestor(by.id('ContactSmall'))),
			).toBeVisible();
			await element(by.id('NavigationClose')).tap();

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
			await expect(element(by.text('John Carvalho'))).toBeVisible();
			await element(by.id('NavigationClose')).tap();

			await element(by.id('BitcoinAsset')).tap();
			await element(by.id('Activity-1')).tap();
			await expect(
				element(by.text('John Carvalho').withAncestor(by.id('ContactSmall'))),
			).toBeVisible();

			markComplete('slash-1');
		});
	});
});
