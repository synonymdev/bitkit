import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
	getSeed,
	restoreWallet,
	waitForBackup,
} from './helpers';
import initElectrum from './electrum';

d = checkComplete('backup-1') ? describe.skip : describe;

d('Backup', () => {
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
		await electrum?.waitForSync();

		await waitFor(element(by.id('ReceivedTransaction')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('ReceivedTransaction')).swipe('down'); // close Receive screen
		await sleep(200); // animation

		// set tag to new tx
		const tag = 'testtag';
		await element(by.id('ActivitySavings')).tap();
		await element(by.id('Activity-1')).tap();
		await element(by.id('ActivityTag')).tap();
		await element(by.id('TagInput')).typeText(tag);
		await element(by.id('TagInput')).tapReturnKey();
		await sleep(200); // animation
		await element(by.id('NavigationClose')).atIndex(0).tap();

		// change currency to GBP
		await element(by.id('TotalBalance')).tap(); // switch to local currency
		await element(by.id('HeaderMenu')).tap();
		await element(by.id('DrawerSettings')).tap();
		await element(by.id('GeneralSettings')).tap();
		await element(by.id('CurrenciesSettings')).tap();
		await element(by.text('GBP (£)')).tap();
		await element(by.id('NavigationClose')).atIndex(0).tap();

		// remove 2 default widgets, leave PriceWidget
		await element(by.id('HomeScrollView')).scroll(200, 'down', 0, 0.5);
		await element(by.id('WidgetsEdit')).tap();
		for (const w of ['NewsWidget', 'BlocksWidget']) {
			await element(by.id('WidgetActionDelete').withAncestor(by.id(w))).tap();
			await element(by.text('Yes, Delete')).tap();
			await expect(element(by.id(w))).not.toBeVisible();
		}
		await element(by.id('WidgetsEdit')).tap();
		await expect(element(by.id('PriceWidget'))).toBeVisible();

		// restore wallet
		const seed = await getSeed();
		await waitForBackup();
		await restoreWallet(seed);

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
		await element(by.id('NavigationClose')).atIndex(0).tap();
		await sleep(200); // animation

		// check widgets
		await element(by.id('HomeScrollView')).scroll(300, 'down', 0, 0.5);
		await expect(element(by.id('PriceWidget'))).toExist();
		await expect(element(by.id('NewsWidget'))).not.toExist();
		await expect(element(by.id('BlocksWidget'))).not.toExist();

		markComplete('backup-1');
	});
});
