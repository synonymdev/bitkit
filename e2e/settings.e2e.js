import { sleep, checkComplete, markComplete } from './helpers';

describe('Settings', () => {
	beforeAll(async () => {
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
	});

	beforeEach(async () => {
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
	});

	describe('General', () => {
		it('Can switch local currency', async () => {
			if (checkComplete('s1')) {
				return;
			}

			// switch to local currency
			await element(by.id('TotalBalance')).tap();

			await sleep(1000);

			await expect(
				element(
					by.id('MoneyCurrencySymbol').withAncestor(by.id('TotalBalance')),
				),
			).toHaveText('$');

			// switch to GBP
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('CurrenciesSettings')).tap();
			await element(by.text('GBP (£)')).tap();
			await element(by.id('NavigationClose')).tap();

			await expect(
				element(
					by.id('MoneyCurrencySymbol').withAncestor(by.id('TotalBalance')),
				),
			).toHaveText('£');

			// switch back to sats
			await element(by.id('TotalBalance')).tap();
			await element(by.id('TotalBalance')).tap();
			markComplete('s1');
		});

		it('Can switch Bitcoin Unit', async () => {
			if (checkComplete('s2')) {
				return;
			}

			// switch to Bitcoins
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('BitcoinUnitSettings')).tap();
			await element(by.id('Bitcoin')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('BitcoinUnitSettings'))),
			).toHaveText('Bitcoin');

			// switch back to Satoshis
			await element(by.id('BitcoinUnitSettings')).tap();
			await element(by.id('Satoshis')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('BitcoinUnitSettings'))),
			).toHaveText('Satoshis');
			markComplete('s2');
		});

		it('Can switch transaction speed', async () => {
			if (checkComplete('s3')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();

			// switch to Fast
			await element(by.id('TransactionSpeedSettings')).tap();
			await element(by.id('fast')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('TransactionSpeedSettings'))),
			).toHaveText('Fast');

			// switch to Custom
			await element(by.id('TransactionSpeedSettings')).tap();
			await element(by.id('custom')).tap();
			await element(by.id('N1').withAncestor(by.id('CustomFee'))).tap();
			await element(by.id('Continue')).tap();
			await element(by.id('NavigationBack')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('TransactionSpeedSettings'))),
			).toHaveText('Custom');

			// switch back to Normal
			await element(by.id('TransactionSpeedSettings')).tap();
			await element(by.id('normal')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('TransactionSpeedSettings'))),
			).toHaveText('Normal');
			markComplete('s3');
		});

		it('Can change hide and reset Suggestions', async () => {
			if (checkComplete('s4')) {
				return;
			}

			await expect(element(by.id('Suggestions'))).toBeVisible();

			// hide backupSeedPhrase suggestion card
			await element(
				by
					.id('SuggestionDismiss')
					.withAncestor(by.id('SuggestionbackupSeedPhrase')),
			).tap();
			await expect(
				element(by.id('SuggestionbackupSeedPhrase')),
			).not.toBeVisible();

			// hide Suggestions
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('SuggestionsSettings')).tap();
			await element(by.id('DisplaySuggestions')).tap();
			await element(by.id('NavigationClose')).tap();
			await expect(element(by.id('Suggestions'))).not.toBeVisible();

			// show Suggestions and reset them
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('SuggestionsSettings')).tap();
			await element(by.id('DisplaySuggestions')).tap();
			await element(by.id('ResetSuggestions')).tap();
			await element(by.id('DialogConfirm')).tap();
			await expect(element(by.id('Suggestions'))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			// backupSeedPhrase should be visible again
			await expect(element(by.id('SuggestionbackupSeedPhrase'))).toBeVisible();
			markComplete('s4');
		});
	});

	describe('Security and Privacy', () => {
		it('Can setup PIN and Biometrics', async () => {
			// test plan:
			// - set up PIN with Biometrics
			// - try login with Biometrics and with PIN
			// - disable PIN
			// - enable PIN without Biometrics
			// - login with PIN
			// - enter wrong PIN 10 times and reset the app
			if (checkComplete('s5')) {
				return;
			}

			await device.setBiometricEnrollment(true);

			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('PINCode')).tap();
			await element(by.id('SecureWallet')).tap();

			await sleep(1000); // wait for animation

			// enter PIN
			await element(by.id('N1')).multiTap(4);
			// retype wrong PIN
			await element(by.id('N2')).multiTap(4);
			// WrongPIN warning should appear
			await expect(element(by.id('WrongPIN'))).toBeVisible();
			// enter PIN
			await element(by.id('N1')).multiTap(4);

			// because biometrics has been enrolled on the device we can now enable it
			await element(by.id('ToggleBiometrics')).tap();
			await element(by.id('ContinueButton')).tap();
			await device.matchFace();

			await element(by.id('ToggleBioForPayments')).tap();
			await element(by.id('OK')).tap();
			await sleep(1000);
			// restart the app and login with Faceid
			await device.launchApp({
				newInstance: true,
				launchArgs: { detoxEnableSynchronization: 0 }, // disable detox synchronization, otherwise it will hang on faceid
			});
			await sleep(1000);
			await waitFor(element(by.id('Biometrics')))
				.toBeVisible()
				.withTimeout(10000);
			await device.matchFace();
			await device.enableSynchronization();
			// app unlocked now
			await expect(element(by.id('TotalBalance'))).toBeVisible();
			await sleep(1000);

			// TODO: restart the app and login with PIN
			// currently not possibe because of Retry faceid system dialog
			// await device.launchApp({
			// 	newInstance: true,
			// 	launchArgs: { detoxEnableSynchronization: 0 }, // disable detox synchronization, otherwise it will hang on faceid
			// });
			// await sleep(1000);
			// await waitFor(element(by.id('Biometrics')))
			// 	.toBeVisible()
			// 	.withTimeout(10000);
			// await device.unmatchFace();
			// await device.enableSynchronization();
			// await sleep(1000);
			// await element(by.label('Cancel')).atIndex(0).tap();

			// disable faceid, but leave PIN, restart the app and try it
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('UseBiometryInstead')).tap();
			await device.matchFace();
			await sleep(1000);

			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('PinPad'))).toBeVisible();
			await sleep(1000);
			await element(by.id('N1').withAncestor(by.id('PinPad'))).multiTap(4);
			await waitFor(element(by.id('TotalBalance')))
				.toBeVisible()
				.withTimeout(10000);

			// disable PIN, restart the app, it should not ask for it
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('PINCode')).tap();
			await element(by.id('DisablePin')).tap();
			await element(by.id('N1').withAncestor(by.id('PinPad'))).multiTap(4);
			await sleep(1000);
			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('TotalBalance')))
				.toBeVisible()
				.withTimeout(10000);

			// TODO: make a separate test becase it disrupts others
			// now lets restart the app and fail to enter correct PIN 8 times
			// await device.launchApp({ newInstance: true });
			// await waitFor(element(by.id('PinPad'))).toBeVisible();
			// await sleep(1000);
			// await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
			// await waitFor(element(by.id('AttemptsRemaining'))).toBeVisible();
			// for (let i = 0; i < 6; i++) {
			// 	await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4); // repeat 6 times
			// }
			// await waitFor(element(by.id('LastAttempt'))).toBeVisible();
			// await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
			// await sleep(1000);

			// // app should show Licence agreement
			// await device.launchApp({ newInstance: true });
			// await waitFor(element(by.id('Check1'))).toBeVisible();
			markComplete('s5');
		});
	});

	describe('Backup or restore', () => {
		it('Can show backup and validate it', async () => {
			if (checkComplete('s6')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('BackupSettings')).tap();
			await element(by.id('BackupData')).tap(); // just check if this screen can be opened
			await element(by.id('NavigationBack')).tap();
			await element(by.id('ResetAndRestore')).tap(); // just check if this screen can be opened
			await element(by.id('NavigationBack')).tap();
			await element(by.id('BackupMoney')).tap();
			await sleep(1000); // animation
			await element(by.id('TapToReveal')).tap();

			// get the seed from SeedContaider
			const { label: seed } = await element(
				by.id('SeedContaider'),
			).getAttributes();
			await element(by.id('ContinueShowMnemonic')).tap();

			// enter the seed
			for (const word of seed.split(' ')) {
				await element(by.id(`Word-${word}`))
					.atIndex(0) // in case there are a few same words in the seed phrase
					.tap();
			}
			await element(by.id('ContinueConfirmMnemonic')).tap();
			await element(by.id('OK')).tap();
			await element(by.id('OK')).tap();
			await element(by.id('OK')).tap();
			await sleep(1000);
			markComplete('s6');
		});
	});

	describe('Advanced', () => {
		it('Can switch address types', async () => {
			if (checkComplete('s7')) {
				return;
			}
			// wallet be in regtest mode by default
			// at first check if it is Native segwit by default
			await element(by.id('Receive')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			const { label: address } = await element(by.id('QRCode')).getAttributes();
			// because we can't use Jest expect in Detox tests, let's just throw an error if there is one
			if (!address.startsWith('bitcoin:bcrt1')) {
				throw new Error('Wrong receiving address');
			}
			await element(by.id('ReceiveScreen')).swipe('down'); // close Receive screen
			await sleep(1000);

			// check same address in Address Viewer
			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('AddressViewer')).tap();
			await waitFor(element(by.id('Address-0')))
				.toBeVisible()
				.withTimeout(30000);

			let { text: text1 } = await element(by.id('Address-0')).getAttributes();
			text1 = text1.replace('0: ', '');
			if (!text1.startsWith('bcrt1')) {
				throw new Error('Wrong address at index 0');
			}

			// check path
			const { text: path1 } = await element(by.id('Path')).getAttributes();
			if (!path1.includes("m/84'/0'/0'")) {
				throw new Error('Wrong path');
			}

			// now switch to Legacy
			await element(by.id('NavigationBack')).tap();
			await element(by.id('AddressTypePreference')).tap();
			await element(by.id('p2pkh')).tap();
			await sleep(1000); // We need a second after switching address types.

			// check address in Address Viewer
			await element(by.id('AddressViewer')).tap();
			await waitFor(element(by.id('Address-0')))
				.toBeVisible()
				.withTimeout(30000);
			let { text: text2 } = await element(by.id('Address-0')).getAttributes();
			text2 = text2.replace('0: ', '');
			if (!text2.startsWith('m')) {
				throw new Error('Wrong address at index 0');
			}

			// check path
			const { text: path2 } = await element(by.id('Path')).getAttributes();
			if (!path2.includes("m/44'/0'/0'")) {
				throw new Error('Wrong path');
			}
			await element(by.id('NavigationClose')).tap();

			// check address on Receiving screen
			await element(by.id('Receive')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			const { label: addr } = await element(by.id('QRCode')).getAttributes();
			// because we can't use Jest expect in Detox tests, let's just throw an error if there is one
			if (!addr.startsWith('bitcoin:m')) {
				throw new Error('Wrong receiving address');
			}
			await element(by.id('ReceiveScreen')).swipe('down'); // close Receive screen
			await sleep(1000);

			// switch back to Native segwit
			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('AddressTypePreference')).tap();
			await element(by.id('p2wpkh')).tap();
			await element(by.id('NavigationClose')).tap();
			await sleep(1000);
			markComplete('s7');
		});

		it('Can open LN settings screens', async () => {
			if (checkComplete('s8')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('DevOptions')).multiTap(5); // enable dev mode
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('Channels')).tap();
			await element(by.id('CopyNodeId')).tap();
			await element(by.id('RefreshLDK')).tap();
			await element(by.id('RestartLDK')).tap();
			await element(by.id('RebroadcastLDKTXS')).tap();
			await sleep(1000);
			await element(by.id('NavigationBack')).tap();

			await element(by.id('LightningNodeInfo')).tap();
			await expect(element(by.id('LDKNodeID'))).toBeVisible();
			await element(by.id('NavigationBack')).tap();
			await element(by.id('NavigationBack')).tap();
			await element(by.id('DevOptions')).multiTap(5); // disable dev mode
			await sleep(1000);
			markComplete('s8');
		});

		it('Can enter wrong Electrum server and get an error message', async () => {
			if (checkComplete('s9')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('ElectrumConfig')).tap();

			// enter wrong electrum server address
			await element(by.id('HostInput')).replaceText('google.com');
			await element(by.id('PortInput')).replaceText('31337');
			await element(by.id('Status')).tap(); // close keyboard
			await element(by.id('ConnectToHost')).tap();

			// disconnected warning should appear
			await waitFor(element(by.id('Disconnected'))).toBeVisible();
			await sleep(1000);

			// switch back to default
			await element(by.id('ResetToDefault')).tap();
			await element(by.id('ConnectToHost')).tap();
			await waitFor(element(by.id('Connected'))).toBeVisible();
			await sleep(1000);
			markComplete('s9');
		});
	});
});
