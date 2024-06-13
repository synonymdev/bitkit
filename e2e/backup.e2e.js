import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
	electrumHost,
	electrumPort,
} from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

d = checkComplete('backup-1') ? describe.skip : describe;

d('Backup', () => {
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

	it('Can backup metadata, widget, settings and restore them', async () => {
		// testplan:
		// - receive some money and set tag
		// - change settings
		// - add widgets
		// - backup seed
		// - restore wallet
		// - check if everything was restored
		if (checkComplete('backup-1')) {
			return;
		}
		// recieve bitcoin
		await element(by.id('Receive')).tap();
		await sleep(200); // animation
		// get address from qrcode
		await waitFor(element(by.id('QRCode'))).toBeVisible();
		await sleep(100); // wait for qr code to render
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');

		await rpc.sendToAddress(wAddress, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
		await sleep(200); // animation

		// set tag to new tx
		const tag = 'testtag';
		await element(by.id('ActivitySavings')).tap();
		await element(by.id('Activity-1')).tap();
		await element(by.id('ActivityTag')).tap();
		await element(by.id('TagInput')).replaceText(tag);
		await element(by.id('TagInput')).tapReturnKey();
		await sleep(200); // animation
		await element(by.id('NavigationClose')).tap();

		// change currency to GBP
		await element(by.id('TotalBalance')).tap(); // switch to local currency
		await element(by.id('Settings')).tap();
		await element(by.id('GeneralSettings')).tap();
		await element(by.id('CurrenciesSettings')).tap();
		await element(by.text('GBP (£)')).tap();
		await element(by.id('NavigationClose')).tap();

		// remove 2 default widgets, leave PriceWidget
		await element(by.id('WalletsScrollView')).scroll(100, 'down', NaN, 0.85);
		await element(by.id('WidgetsEdit')).tap();
		for (const w of ['HeadlinesWidget', 'BlocksWidget']) {
			await element(by.id('WidgetActionDelete').withAncestor(by.id(w))).tap();
			await element(by.text('Yes, Delete')).tap();
			await expect(element(by.id(w))).not.toBeVisible();
		}
		await element(by.id('WidgetsEdit')).tap();
		await expect(element(by.id('PriceWidget'))).toBeVisible();

		await element(by.id('TransferButton')).swipe('up');

		// get seed
		await element(by.id('Settings')).tap();
		await element(by.id('BackupSettings')).tap();
		await element(by.id('BackupWallet')).tap();
		await sleep(200); // animation
		await element(by.id('TapToReveal')).tap();

		// get the seed from SeedContaider
		const { label: seed } = await element(
			by.id('SeedContaider'),
		).getAttributes();

		await element(by.id('SeedContaider')).swipe('down');
		await sleep(200); // animation
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
		await element(by.id('MultipleDevices-button')).tap();
		await element(by.id('Word-0')).replaceText(seed);
		await element(by.id('WordIndex-4')).swipe('up');
		await element(by.id('RestoreButton')).tap();

		await waitFor(element(by.id('GetStartedButton')))
			.toBeVisible()
			.withTimeout(300000); // 5 min
		await element(by.id('GetStartedButton')).tap();

		// wait for SuggestionsLabel to appear and be accessible
		for (let i = 0; i < 60; i++) {
			await sleep(200);
			try {
				await element(by.id('SuggestionsLabel')).tap();
				break;
			} catch (e) {}
		}

		// check settings
		await expect(
			element(by.id('MoneyFiatSymbol').withAncestor(by.id('TotalBalance'))),
		).toHaveText('£');

		// check metadata
		await element(by.id('ActivitySavings')).tap();
		await element(by.id('Activity-1')).tap();
		await expect(
			element(by.id(`Tag-${tag}`).withAncestor(by.id('ActivityTags'))),
		).toBeVisible();
		await element(by.id('NavigationClose')).tap();

		// check widgets
		await element(by.id('WalletsScrollView')).scroll(300, 'down', NaN, 0.85);
		await expect(element(by.id('PriceWidget'))).toExist();
		await expect(element(by.id('HeadlinesWidget'))).not.toExist();
		await expect(element(by.id('BlocksWidget'))).not.toExist();

		markComplete('backup-1');
	});
});
