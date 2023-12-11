import jestExpect from 'expect';
import parse from 'url-parse';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	electrumHost,
	electrumPort,
} from './helpers';

const __DEV__ = process.env.DEV === 'true';

const d = checkComplete([
	'settings-1',
	'settings-2',
	'settings-3',
	'settings-4',
	'settings-5',
	'settings-6',
	'settings-7',
	'settings-8',
	'settings-9',
	'settings-10',
	'settings-11',
	'settings-12',
])
	? describe.skip
	: describe;

d('Settings', () => {
	beforeAll(async () => {
		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
	});

	d('General', () => {
		it('Can switch local currency', async () => {
			if (checkComplete('settings-1')) {
				return;
			}

			// switch to local currency
			await element(by.id('TotalBalance')).tap();

			await sleep(1000);

			await expect(
				element(by.id('MoneyFiatSymbol').withAncestor(by.id('TotalBalance'))),
			).toHaveText('$');

			// switch to GBP
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('CurrenciesSettings')).tap();
			await element(by.text('GBP (£)')).tap();
			await element(by.id('NavigationClose')).tap();

			await expect(
				element(by.id('MoneyFiatSymbol').withAncestor(by.id('TotalBalance'))),
			).toHaveText('£');

			// switch back to sats
			await element(by.id('TotalBalance')).tap();
			await element(by.id('TotalBalance')).tap();
			markComplete('settings-1');
		});

		it('Can switch Bitcoin Unit', async () => {
			if (checkComplete('settings-2')) {
				return;
			}

			// switch to Bitcoins
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('UnitSettings')).tap();
			await element(by.id('Bitcoin')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('UnitSettings'))),
			).toHaveText('Bitcoin');

			// switch back to Satoshis
			await element(by.id('UnitSettings')).tap();
			await element(by.id('Satoshis')).tap();
			await expect(
				element(by.id('Value').withAncestor(by.id('UnitSettings'))),
			).toHaveText('Satoshis');
			markComplete('settings-2');
		});

		it('Can switch transaction speed', async () => {
			if (checkComplete('settings-3')) {
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
			markComplete('settings-3');
		});

		it('Can change hide and reset Suggestions', async () => {
			if (checkComplete('settings-4')) {
				return;
			}

			await expect(element(by.id('Suggestions'))).toBeVisible();

			// hide backupSeedPhrase suggestion card
			await element(
				by
					.id('SuggestionDismiss')
					.withAncestor(by.id('Suggestion-backupSeedPhrase')),
			).tap();
			await expect(
				element(by.id('Suggestion-backupSeedPhrase')),
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

			// backupSeedPhrase should be visible again
			await expect(element(by.id('Suggestion-backupSeedPhrase'))).toBeVisible();
			markComplete('settings-4');
		});

		it('Can remove last used tags', async () => {
			if (checkComplete('settings-5')) {
				return;
			}

			// no tags, menu entry should be hidden
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await expect(element(by.id('TagsSettings'))).not.toBeVisible();
			await element(by.id('NavigationClose')).tap();

			// open receive tags, add a tag
			const tag = 'test123';
			await element(by.id('Receive')).tap();
			await element(by.id('UnderstoodButton')).tap();
			await element(by.id('SpecifyInvoiceButton')).tap();
			await expect(element(by.text(tag))).not.toBeVisible();
			await element(by.id('TagsAdd')).tap();
			await expect(element(by.text(tag))).not.toBeVisible();
			await element(by.id('TagInputReceive')).typeText(tag);
			await element(by.id('ReceiveTagsSubmit')).tap();
			await expect(element(by.text(tag))).toBeVisible();
			await element(by.id('ReceiveScreen')).swipe('down');
			await sleep(1000);

			// open tag manager, delete tag
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('TagsSettings')).tap();
			await expect(element(by.text(tag))).toBeVisible();
			await element(by.id(`Tag-${tag}-delete`)).tap();
			await element(by.id('NavigationClose')).tap();

			// open receive tags, check tags are gone
			await element(by.id('Receive')).tap();
			await element(by.id('SpecifyInvoiceButton')).tap();
			await expect(element(by.text(tag))).not.toBeVisible();
			await element(by.id('TagsAdd')).tap();
			await expect(element(by.text(tag))).not.toBeVisible();

			markComplete('settings-5');
		});
	});

	d('Backup or restore', () => {
		it('Can show backup and validate it', async () => {
			if (checkComplete('settings-6')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('BackupSettings')).tap();
			await element(by.id('ResetAndRestore')).tap(); // just check if this screen can be opened
			await element(by.id('NavigationBack')).tap();
			await element(by.id('BackupWallet')).tap();
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
			await sleep(1000);
			await element(by.id('ContinueConfirmMnemonic')).tap();
			await element(by.id('OK')).tap();
			await element(by.id('OK')).tap();
			await element(by.id('OK')).tap();
			await element(by.id('OK')).tap();
			await sleep(1000);
			markComplete('settings-6');
		});
	});

	d('Advanced', () => {
		it('Can switch address types', async () => {
			if (checkComplete('settings-7')) {
				return;
			}
			// wallet be in regtest mode by default
			// at first check if it is Native segwit by default
			await element(by.id('Receive')).tap();
			try {
				await element(by.id('UnderstoodButton')).tap();
			} catch (e) {}
			await waitFor(element(by.id('QRCode')))
				.toBeVisible()
				.withTimeout(30000);
			// get address from qrcode
			const { label: address } = await element(by.id('QRCode')).getAttributes();
			// because we can't use Jest expect in Detox tests, let's just throw an error if there is one
			if (!address.startsWith('bitcoin:bcrt1')) {
				throw new Error(`Wrong receiving address: ${address}`);
			}
			await element(by.id('ReceiveScreen')).swipe('down'); // close Receive screen
			await sleep(1000);

			// check same address in Address Viewer
			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('WebRelay')).swipe('up');
			await element(by.id('AddressViewer')).tap();
			await sleep(1000);
			await waitFor(element(by.id('Address-0')))
				.toBeVisible()
				.withTimeout(30000);

			let { text: text1 } = await element(by.id('Address-0')).getAttributes();
			text1 = text1.replace('0: ', '');
			if (!text1.startsWith('bcrt1')) {
				throw new Error(`Wrong address at index 0: ${text1}`);
			}

			// check path
			const { text: path1 } = await element(by.id('Path')).getAttributes();
			if (!path1.includes("m/84'/0'/0'")) {
				throw new Error(`Wrong path: ${path1}`);
			}

			// now switch to Legacy
			await element(by.id('NavigationBack')).tap();
			await element(by.id('NavigationBack')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('AddressTypePreference')).tap();
			await element(by.id('p2pkh')).tap();
			await sleep(1000); // We need a second after switching address types.

			// check address in Address Viewer
			await element(by.id('WebRelay')).swipe('up');
			await element(by.id('AddressViewer')).tap();
			await sleep(1000);
			await waitFor(element(by.id('Address-0')))
				.toBeVisible()
				.withTimeout(30000);
			let { text: text2 } = await element(by.id('Address-0')).getAttributes();
			text2 = text2.replace('0: ', '');
			if (!text2.startsWith('m') && !text2.startsWith('n')) {
				throw new Error(`Wrong address at index 0: ${text2}`);
			}

			// check path
			const { text: path2 } = await element(by.id('Path')).getAttributes();
			if (!path2.includes("m/44'/0'/0'")) {
				throw new Error(`Wrong path: ${path2}`);
			}
			await element(by.id('NavigationClose')).tap();

			// check address on Receiving screen
			await element(by.id('Receive')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			const { label: addr } = await element(by.id('QRCode')).getAttributes();
			// because we can't use Jest expect in Detox tests, let's just throw an error if there is one
			if (!addr.startsWith('bitcoin:m') && !addr.startsWith('bitcoin:n')) {
				throw new Error(`Wrong receiving address: ${addr}`);
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
			markComplete('settings-7');
		});

		it('Can open LN settings screens', async () => {
			if (checkComplete('settings-8')) {
				return;
			}

			await element(by.id('Settings')).tap();
			if (!__DEV__) {
				await element(by.id('DevOptions')).multiTap(5); // enable dev mode
			}
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('Channels')).tap();
			await element(by.id('CopyNodeId')).tap();
			await element(by.id('RefreshLDK')).tap();
			await element(by.id('RestartLDK')).tap();
			await element(by.id('RebroadcastLDKTXS')).tap();
			await waitFor(element(by.id('NavigationBack')))
				.toBeVisible()
				.withTimeout(5000);
			await element(by.id('NavigationBack')).tap();

			await element(by.id('LightningNodeInfo')).tap();
			// TODO: this fails too often on CI
			// await waitFor(element(by.id('LDKNodeID')))
			// 	.toBeVisible()
			// 	.withTimeout(30000);
			await element(by.id('NavigationBack')).tap();
			await element(by.id('NavigationBack')).tap();
			if (!__DEV__) {
				await element(by.id('DevOptions')).multiTap(5); // disable dev mode
			}
			await sleep(1000);
			markComplete('settings-8');
		});

		it('Can enter wrong Electrum server and get an error message', async () => {
			if (checkComplete('settings-9')) {
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

			// scanner - check all possible connection formats
			// Umbrel format
			const umbrel1 = {
				url: `${electrumHost}:${electrumPort}:t`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: 'tcp',
			};
			const umbrel2 = {
				url: `${electrumHost}:${electrumPort}:s`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: 'ssl',
			};

			// should detect protocol for common ports
			const noProto1 = {
				url: `${electrumHost}:50001`,
				expectedHost: electrumHost,
				expectedPort: '50001',
				expectedProtocol: 'tcp',
			};
			const noProto2 = {
				url: `${electrumHost}:50002`,
				expectedHost: electrumHost,
				expectedPort: '50002',
				expectedProtocol: 'ssl',
			};

			// HTTP URL
			const http1 = {
				url: `http://${electrumHost}:${electrumPort}`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: 'tcp',
			};
			const http2 = {
				url: `https://${electrumHost}:${electrumPort}`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: 'ssl',
			};

			const conns = [umbrel1, umbrel2, noProto1, noProto2, http1, http2];

			for (const conn of conns) {
				await element(by.id('NavigationAction')).tap();
				await element(by.id('ScanPrompt')).tap();
				await element(by.type('_UIAlertControllerTextField')).replaceText(
					conn.url,
				);
				await element(
					by.label('OK').and(by.type('_UIAlertControllerActionView')),
				).tap();
				await expect(element(by.id('HostInput'))).toHaveText(conn.expectedHost);
				await expect(element(by.id('PortInput'))).toHaveText(conn.expectedPort);
				const attrs = await element(by.id('ElectrumProtocol')).getAttributes();
				jestExpect(attrs.label).toBe(conn.expectedProtocol);
			}

			// switch back to default
			await element(by.id('ResetToDefault')).tap();
			await element(by.id('ConnectToHost')).tap();
			await waitFor(element(by.id('Connected'))).toBeVisible();
			await sleep(1000);

			markComplete('settings-9');
		});

		it('Can connect to different Slashtags Web Relay', async () => {
			if (checkComplete('settings-10')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('WebRelay')).tap();

			const { label: origRelay } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			// add port to url
			const url = parse(origRelay, true);
			url.set('hostname', url.hostname + ':443');
			const relayUrl = url.toString();

			await element(by.id('UrlInput')).replaceText(relayUrl);
			await element(by.id('Status')).tap(); // close keyboard
			await element(by.id('ConnectToUrl')).tap();
			await sleep(1000);

			// url should be updated
			let { label: newRelay } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			jestExpect(newRelay).toBe(relayUrl);

			// now change it back
			await element(by.id('UrlInput')).replaceText(origRelay);
			await element(by.id('Status')).tap(); // close keyboard
			await element(by.id('ConnectToUrl')).tap();

			markComplete('settings-10');
		});

		it('Can connect to different Rappid Gosip Sync Server', async () => {
			if (checkComplete('settings-11')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('RGSServer')).tap();

			const { label: origValue } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			// add slash at the end
			const newUrl = origValue + '/';
			await element(by.id('RGSUrl')).replaceText(newUrl);
			await element(by.id('RGSUrl')).tapReturnKey();
			await element(by.id('ConnectToHost')).tap();
			await sleep(1000);

			// url should be updated
			let { label: newValue } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			jestExpect(newValue).toBe(newUrl);

			// switch back to default
			await element(by.id('ResetToDefault')).tap();
			await element(by.id('ConnectToHost')).tap();

			let { label: resetValue } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			jestExpect(resetValue).toBe(origValue);

			markComplete('settings-11');
		});
	});

	d('Dev Settings', () => {
		it('Shows the crash error screen when triggering render error', async () => {
			if (checkComplete('settings-12')) {
				return;
			}

			await element(by.id('Settings')).tap();
			if (!__DEV__) {
				await element(by.id('DevOptions')).multiTap(5); // enable dev mode
			}
			await element(by.id('DevSettings')).tap();
			await expect(element(by.id('SlashtagsSettings'))).toBeVisible();

			// Error screen will not be rendered in development mode
			if (__DEV__) {
				markComplete('settings-10');
				return;
			}

			await element(by.id('TriggerRenderError')).tap();
			await expect(element(by.id('ErrorClose'))).toBeVisible();
			await expect(element(by.id('ErrorReport'))).toBeVisible();

			markComplete('settings-12');
		});
	});

	d('Security and Privacy', () => {
		it('Can setup PIN and Biometrics', async () => {
			// test plan:
			// - set up PIN with Biometrics
			// - try login with Biometrics and with PIN
			// - enable PIN without Biometrics
			// - change PIN
			// - login with PIN
			// - disable PIN
			// - enter wrong PIN 10 times and reset the app
			if (checkComplete('settings-13')) {
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
			await sleep(1000);
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

			// test PIN on idle and disable it after
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('EnablePinOnIdle')).tap();
			await device.matchFace();
			await waitFor(element(by.id('Biometrics')))
				.toBeVisible()
				.withTimeout(100000);
			await device.matchFace();
			await element(by.id('EnablePinOnIdle')).tap();
			await device.matchFace();
			await sleep(3000);

			// disable FaceID, change PIN, restart the app and try it
			await element(by.id('UseBiometryInstead')).tap();
			await device.matchFace();
			await element(by.id('ChangePIN')).tap();
			await element(by.id('N1').withAncestor(by.id('ChangePIN'))).multiTap(4);
			await sleep(1000);
			await element(by.id('N2').withAncestor(by.id('ChangePIN2'))).multiTap(4);
			await element(by.id('N9').withAncestor(by.id('ChangePIN2'))).multiTap(4);
			await expect(element(by.id('WrongPIN'))).toBeVisible();
			await element(by.id('N2').withAncestor(by.id('ChangePIN2'))).multiTap(4);
			await element(by.id('OK')).tap();

			await device.launchApp({ newInstance: true });
			await waitFor(element(by.id('PinPad'))).toBeVisible();
			await sleep(1000);
			await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
			await waitFor(element(by.id('TotalBalance')))
				.toBeVisible()
				.withTimeout(10000);

			// disable PIN, restart the app, it should not ask for it
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('PINCode')).tap();
			await element(by.id('DisablePin')).tap();
			await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
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

			markComplete('settings-13');
		});
	});
});
