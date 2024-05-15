import jestExpect from 'expect';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	electrumHost,
	electrumPort,
} from './helpers';
import { EProtocol } from 'beignet';

const __DEV__ = process.env.DEV === 'true';

const d = checkComplete([
	'settings-currency',
	'settings-unit',
	'settings-speed',
	'settings-tags',
	'settings-security-balance',
	'settings-backup',
	'settings-addr-type',
	'settings-ln-settings',
	'settings-electrum',
	'settings-webrelay',
	'settings-rgs',
	'settings-suggestions',
	'settings-dev',
	'settings-support-status',
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
			if (checkComplete('settings-currency')) {
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

			markComplete('settings-currency');
		});

		it('Can switch Bitcoin Unit', async () => {
			if (checkComplete('settings-unit')) {
				return;
			}

			const fiatSymbol = await element(
				by.id('MoneyFiatSymbol').withAncestor(by.id('TotalBalance')),
			);
			const balance = await element(
				by.id('MoneyText').withAncestor(by.id('TotalBalance')),
			);
			const unitRow = await element(
				by.id('Value').withAncestor(by.id('UnitSettings')),
			);

			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			// check default unit
			await expect(unitRow).toHaveText('Bitcoin');

			// switch to GBP
			await element(by.id('UnitSettings')).tap();
			await element(by.id('GBP')).tap();
			await element(by.id('NavigationBack')).tap();
			await expect(unitRow).toHaveText('GBP');
			await element(by.id('NavigationClose')).tap();
			await expect(fiatSymbol).toHaveText('£');
			await expect(balance).toHaveText('0.00');

			// switch back to BTC
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('UnitSettings')).tap();
			await element(by.id('Bitcoin')).tap();
			await element(by.id('NavigationBack')).tap();
			await expect(unitRow).toHaveText('Bitcoin');
			await element(by.id('NavigationClose')).tap();
			await expect(balance).toHaveText('0');

			// switch to classic denomination
			await element(by.id('Settings')).tap();
			await element(by.id('GeneralSettings')).tap();
			await element(by.id('UnitSettings')).tap();
			await element(by.id('DenominationClassic')).tap();
			await element(by.id('NavigationBack')).tap();
			await expect(unitRow).toHaveText('Bitcoin');
			await element(by.id('NavigationClose')).tap();
			await expect(balance).toHaveText('0.00000000');

			markComplete('settings-unit');
		});

		it('Can switch transaction speed', async () => {
			if (checkComplete('settings-speed')) {
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
			markComplete('settings-speed');
		});

		it('Can remove last used tags', async () => {
			if (checkComplete('settings-tags')) {
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

			markComplete('settings-tags');
		});

		d('About', () => {
			it('Can show About screen', async () => {
				if (checkComplete('settings-about')) {
					return;
				}

				await element(by.id('Settings')).tap();
				await element(by.id('About')).tap();
				await expect(element(by.id('AboutLogo'))).toBeVisible();

				markComplete('settings-about');
			});
		});
	});

	d('Security and Privacy', () => {
		it('Can swipe to hide balance', async () => {
			// test plan:
			// - swipe to hide balance
			// - disable 'swipe to hide balance'
			// - enable 'hide balance on open'

			if (checkComplete('settings-security-balance')) {
				return;
			}

			// Balance should be visible
			await expect(element(by.id('ShowBalance'))).not.toBeVisible();
			// Swipe to hide balance
			await element(by.id('TotalBalance')).swipe('right');
			// Balance should be hidden
			await expect(element(by.id('ShowBalance'))).toBeVisible();

			// Disable 'swipe to hide balance'
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('SwipeBalanceToHide')).tap();
			await element(by.id('NavigationClose')).tap();

			// Balance should be visible
			await expect(element(by.id('ShowBalance'))).not.toBeVisible();
			// Should not be able to hide balance
			await element(by.id('TotalBalance')).swipe('right');
			// Balance should still be visible
			await expect(element(by.id('ShowBalance'))).not.toBeVisible();

			// Enable 'hide balance on open'
			await element(by.id('Settings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('SwipeBalanceToHide')).tap();
			await element(by.id('HideBalanceOnOpen')).tap();

			// Restart the app
			await launchAndWait();
			// Balance should be hidden
			await expect(element(by.id('ShowBalance'))).toBeVisible();

			markComplete('settings-security-balance');
		});
	});

	d('Backup or restore', () => {
		it('Can show backup and validate it', async () => {
			if (checkComplete('settings-backup')) {
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
			markComplete('settings-backup');
		});
	});

	d('Advanced', () => {
		it('Can switch address types', async () => {
			if (checkComplete('settings-addr-type')) {
				return;
			}
			// wallet be in regtest mode by default
			// at first check if it is Native segwit by default
			await element(by.id('Receive')).tap();
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
			if (!path1.includes("m/84'/1'/0'")) {
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
			if (!path2.includes("m/44'/1'/0'")) {
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
			markComplete('settings-addr-type');
		});

		it('Can open LN settings screens', async () => {
			if (checkComplete('settings-ln-settings')) {
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
			markComplete('settings-ln-settings');
		});

		it('Can enter wrong Electrum server and get an error message', async () => {
			if (checkComplete('settings-electrum')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('ElectrumConfig')).tap();

			// enter wrong electrum server address
			await element(by.id('HostInput')).replaceText('google.com');
			await element(by.id('PortInput')).replaceText('31337');
			await element(by.id('ElectrumStatus')).tap(); // close keyboard
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
				expectedProtocol: EProtocol.tcp,
			};
			const umbrel2 = {
				url: `${electrumHost}:${electrumPort}:s`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: EProtocol.ssl,
			};

			// should detect protocol for common ports
			const noProto1 = {
				url: `${electrumHost}:50001`,
				expectedHost: electrumHost,
				expectedPort: '50001',
				expectedProtocol: EProtocol.tcp,
			};
			const noProto2 = {
				url: `${electrumHost}:50002`,
				expectedHost: electrumHost,
				expectedPort: '50002',
				expectedProtocol: EProtocol.ssl,
			};

			// HTTP URL
			const http1 = {
				url: `http://${electrumHost}:${electrumPort}`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: EProtocol.tcp,
			};
			const http2 = {
				url: `https://${electrumHost}:${electrumPort}`,
				expectedHost: electrumHost,
				expectedPort: electrumPort.toString(),
				expectedProtocol: EProtocol.ssl,
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

			markComplete('settings-electrum');
		});

		it('Can connect to different Slashtags Web Relay', async () => {
			if (checkComplete('settings-webrelay')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('WebRelay')).tap();

			const { label: origRelay } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			const alteredRelay = origRelay + '/';
			await element(by.id('UrlInput')).replaceText(alteredRelay);
			await element(by.id('WebRelayStatus')).tap(); // close keyboard
			await element(by.id('ConnectToUrl')).tap();
			await sleep(1000);

			// url should be updated
			let { label: newRelay } = await element(
				by.id('ConnectedUrl'),
			).getAttributes();

			jestExpect(newRelay).toBe(alteredRelay);

			// now change it back
			await element(by.id('UrlInput')).replaceText(origRelay);
			await element(by.id('WebRelayStatus')).tap(); // close keyboard
			await element(by.id('ConnectToUrl')).tap();

			markComplete('settings-webrelay');
		});

		it('Can connect to different Rappid Gosip Sync Server', async () => {
			if (checkComplete('settings-rgs')) {
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

			markComplete('settings-rgs');
		});

		it('Can reset suggestions', async () => {
			if (checkComplete('settings-suggestions')) {
				return;
			}

			await expect(element(by.id('Suggestions'))).toBeVisible();

			// hide lightningTodo suggestion card
			await element(
				by.id('SuggestionDismiss').withAncestor(by.id('Suggestion-lightning')),
			).tap();
			await expect(element(by.id('Suggestion-lightning'))).not.toBeVisible();

			// reset suggestions
			await element(by.id('Settings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await element(by.id('WebRelay')).swipe('up');
			await element(by.id('ResetSuggestions')).tap();
			await element(by.id('DialogConfirm')).tap();

			// lightning should be visible again
			await expect(element(by.id('Suggestion-lightning'))).toBeVisible();
			markComplete('settings-suggestions');
		});
	});

	d('Dev Settings', () => {
		it('Shows the crash error screen when triggering render error', async () => {
			if (checkComplete('settings-dev')) {
				return;
			}

			await element(by.id('Settings')).tap();
			if (!__DEV__) {
				await element(by.id('DevOptions')).multiTap(5); // enable dev mode
			}
			await element(by.id('DevSettings')).tap();

			// Error screen will not be rendered in development mode
			if (__DEV__) {
				markComplete('settings-dev');
				return;
			}

			await element(by.id('TriggerRenderError')).tap();
			await expect(element(by.id('ErrorClose'))).toBeVisible();
			await expect(element(by.id('ErrorReport'))).toBeVisible();

			markComplete('settings-dev');
		});
	});

	d('Support', () => {
		it('Can see app status', async () => {
			if (checkComplete('settings-support-status')) {
				return;
			}

			await element(by.id('Settings')).tap();
			await element(by.id('Support')).tap();
			await element(by.id('AppStatus')).tap();

			await expect(element(by.id('Status-internet'))).toBeVisible();
			await expect(element(by.id('Status-bitcoin_node'))).toBeVisible();
			await expect(element(by.id('Status-lightning_node'))).toBeVisible();
			await expect(element(by.id('Status-lightning_connection'))).toBeVisible();
			await expect(element(by.id('Status-full_backup'))).toBeVisible();

			await element(by.id('NavigationClose')).tap();

			markComplete('settings-support-status');
		});
	});
});
