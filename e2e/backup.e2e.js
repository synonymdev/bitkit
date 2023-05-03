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

describe('Backup', () => {
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

	it('Can backup metadata, widget, settings and restore them', async () => {
		// testplan:
		// - receive some money and set tag
		// - change settings
		// - add widgets
		// - backup seed
		// - restore wallet
		// - check if everything was restored
		if (checkComplete('b1')) {
			return;
		}
		// recieve bitcoin
		await element(by.id('Receive')).tap();
		await element(by.id('UnderstoodButton')).tap();
		await sleep(1000); // animation
		// get address from qrcode
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');

		await rpc.sendToAddress(wAddress, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
		await sleep(1000); // animation

		// set tag to new tx
		await element(by.id('BitcoinAsset')).tap();
		await element(by.id('Activity-1')).tap();
		await element(by.id('ActivityTag')).tap();
		await element(by.id('TagInput')).replaceText('testtag');
		await element(by.id('TagInput')).tapReturnKey();
		await sleep(1000); // animation
		await element(by.id('NavigationClose')).tap();

		// change currency to GBP
		await element(by.id('TotalBalance')).tap(); // switch to local currency
		await element(by.id('Settings')).tap();
		await element(by.id('GeneralSettings')).tap();
		await element(by.id('CurrenciesSettings')).tap();
		await element(by.text('GBP (£)')).tap();
		await element(by.id('NavigationClose')).tap();

		// add price widget
		await element(by.id('WidgetsAdd')).tap();
		await element(by.id('ContinueWidgets')).tap();
		await element(by.id('ContinueWidgets')).tap();
		await element(by.id('PriceWidget')).tap();
		// for unknown reason await waitFor(element(by.id('HourglassSpinner'))).not.toBeVisible();
		// doesn't work here, so instead we just wait until we can tap SaveWidget
		// 5 min timeout
		for (let i = 0; i < 300; i++) {
			await sleep(1000);
			try {
				await element(by.id('SaveWidget')).tap();
				break;
			} catch (e) {}
		}

		await sleep(1000); // animation
		await element(by.id('AssetsTitle')).swipe('up');

		// add headlines widget
		await element(by.id('WidgetsAdd')).tap();
		await element(by.id('HeadlinesWidget')).tap();
		// for unknown reason await waitFor(element(by.id('HourglassSpinner'))).not.toBeVisible();
		// doesn't work here, so instead we just wait until we can tap SaveWidget
		// 5 min timeout
		for (let i = 0; i < 300; i++) {
			await sleep(1000);
			try {
				await element(by.id('SaveWidget')).tap();
				break;
			} catch (e) {}
		}

		await sleep(1000); // animation
		await element(by.id('WidgetsTitle')).swipe('down');

		// get seed
		await element(by.id('Settings')).tap();
		await element(by.id('BackupSettings')).tap();
		await element(by.id('BackupWallet')).tap();
		await sleep(1000); // animation
		await element(by.id('TapToReveal')).tap();

		// get the seed from SeedContaider
		const { label: seed } = await element(
			by.id('SeedContaider'),
		).getAttributes();

		await element(by.id('SeedContaider')).swipe('down');
		await sleep(1000); // animation
		await element(by.id('NavigationClose')).tap();

		await sleep(5000); // make sure everything is saved to cloud storage TODO: improve this

		console.info('seed: ', seed);

		// restore wallet
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

		// check settings
		await expect(
			element(by.id('MoneyFiatSymbol').withAncestor(by.id('TotalBalance'))),
		).toHaveText('£');

		// check metadata
		await element(by.id('BitcoinAsset')).tap();
		await element(by.id('Activity-1')).tap();
		await expect(element(by.id('ActivityTag-0'))).toHaveText('testtag');
		await element(by.id('NavigationClose')).tap();

		// check widgets
		await element(by.id('WidgetsTitle')).swipe('up');
		await expect(element(by.id('PriceWidget'))).toBeVisible();
		await expect(element(by.id('HeadlinesWidget'))).toBeVisible();

		markComplete('b1');
	});
});
