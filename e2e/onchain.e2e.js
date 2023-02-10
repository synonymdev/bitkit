import BitcoinJsonRpc from 'bitcoin-json-rpc';

import { sleep, checkComplete, markComplete } from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

const bitcoinURL =
	'http://electrumx:1VmSUVGBuLNWvZl0LExRDW0tvl6196-47RfXIzS384g=@localhost:43782';

describe('Onchain', () => {
	let waitForElectrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

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

		// wat for wallet to be created
		await waitFor(element(by.id('ToGetStartedClose'))).toBeVisible();
		await sleep(1000); // take app some time to load

		// repeat 60 times before fail
		for (let i = 0; i < 60; i++) {
			try {
				await element(by.id('ToGetStartedClose')).tap();
				await sleep(1000);
				break;
			} catch (e) {
				continue;
			}
		}

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
		await waitForElectrum();
	});

	afterEach(() => {
		waitForElectrum?.close();
	});

	describe('Receive and Send', () => {
		it('Can receive 3 transactions and send them all at once', async () => {
			if (checkComplete('o1')) {
				return;
			}

			for (let i = 0; i < 3; i++) {
				await element(by.id('Receive')).tap();
				await sleep(1000); // animation
				// get address from qrcode
				let { label: wAddress } = await element(
					by.id('QRCode'),
				).getAttributes();
				wAddress = wAddress.replace('bitcoin:', '');

				await rpc.sendToAddress(wAddress, '1');
				await rpc.generateToAddress(1, await rpc.getNewAddress());
				await waitForElectrum();

				await waitFor(element(by.id('NewTxPrompt')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
				await sleep(1000); // animation
			}

			// balance should be 3 bitcoins
			await expect(
				element(by.id('MoneyPrimary').withAncestor(by.id('TotalBalance'))),
			).toHaveText('300 000 000');

			const coreAddress = await rpc.getNewAddress();
			await element(by.id('Send')).tap();
			await sleep(1000); // animation
			await element(by.id('AddressOrSlashpay')).typeText(coreAddress);
			await element(by.id('AddressOrSlashpay')).tapReturnKey();
			await sleep(2000); // validation
			await element(by.id('ContinueRecipient')).tap();
			await element(by.id('MAX')).tap();
			await element(by.id('ContinueAmount')).tap();
			await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
			await sleep(1000); // animation
			// await device.enableSynchronization();
			await waitFor(element(by.id('DialogSend50'))) // sending over 50% of balance warning
				.toBeVisible()
				.withTimeout(10000);
			await sleep(1000); // animation
			await element(by.id('DialogConfirm')).tap();
			await waitFor(element(by.id('SendSuccess')))
				.toBeVisible()
				.withTimeout(10000);
			await sleep(1000); // animation
			await element(by.id('Close')).tap();

			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await waitForElectrum();
			await sleep(1000); // animation

			// balance should be 0 bticoins
			await expect(
				element(by.id('MoneyPrimary').withAncestor(by.id('TotalBalance'))),
			).toHaveText('0');

			markComplete('o1');
		});
	});
});
