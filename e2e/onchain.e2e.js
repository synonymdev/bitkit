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

describe('Onchain', () => {
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

	describe('Receive and Send', () => {
		it('Can receive 3 transactions and send them all at once', async () => {
			if (checkComplete('o1')) {
				return;
			}

			for (let i = 0; i < 2; i++) {
				await element(by.id('Receive')).tap();
				if (i === 0) {
					await element(by.id('UnderstoodButton')).tap();
				}
				await sleep(1000); // animation
				// get address from qrcode
				let { label: wAddress } = await element(
					by.id('QRCode'),
				).getAttributes();
				wAddress = wAddress.replace('bitcoin:', '');

				await element(by.id('SpecifyInvoiceButton')).tap();
				await element(by.id('TagsAdd')).tap();
				await element(by.id('TagInputReceive')).typeText(`rtag${i}`);
				await element(by.id('TagInputReceive')).tapReturnKey();
				await element(by.id('ShowQrReceive')).tap();

				await rpc.sendToAddress(wAddress, '1');
				await rpc.generateToAddress(1, await rpc.getNewAddress());
				await waitForElectrum();

				await waitFor(element(by.id('NewTxPrompt')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
				await sleep(1000); // animation
			}

			// balance should be 2 bitcoins
			await expect(
				element(by.id('MoneyPrimary').withAncestor(by.id('TotalBalance'))),
			).toHaveText('200 000 000');

			const coreAddress = await rpc.getNewAddress();
			await element(by.id('Send')).tap();
			await sleep(1000); // animation
			await element(by.id('AddressOrSlashpay')).typeText(coreAddress);
			await element(by.id('AddressOrSlashpay')).tapReturnKey();
			await sleep(2000); // validation
			await element(by.id('ContinueRecipient')).tap();
			await element(by.id('MAX')).tap();
			await element(by.id('ContinueAmount')).tap();
			await element(by.id('TagsAddSend')).tap(); // add tag
			await element(by.id('TagInputSend')).typeText('stag');
			await element(by.id('TagInputSend')).tapReturnKey();
			await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
			await sleep(1000); // animation
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

			//check Activity
			await element(by.id('AssetsTitle')).swipe('up');
			await expect(element(by.id('ActivityShort-1'))).toBeVisible();
			await expect(element(by.id('ActivityShort-2'))).toBeVisible();
			await expect(element(by.id('ActivityShort-3'))).toBeVisible();

			await element(by.id('ActivityShowAll')).tap();

			// All, 3 transactions
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
			).toHaveText('+');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-3'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-4'))).not.toExist();

			// Sent, 1 transaction
			await element(by.id('Tab-sent')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(element(by.id('Activity-2'))).not.toExist();

			// Received, 2 transactions
			await element(by.id('Tab-received')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('+');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-3'))).not.toExist();

			// Instant, 0 transactions
			await element(by.id('Tab-instant')).tap();
			await expect(element(by.id('Activity-1'))).not.toExist();
			await element(by.id('Tab-all')).tap();

			// filter by receive tag
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('rtag0')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('rtag0-close')).tap();

			// filter by send tag
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('stag')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('stag-close')).tap();

			// calendar, previous month, 0 transactions
			await element(by.id('TimeRangePrompt')).tap();
			await expect(element(by.id('Today'))).toBeVisible();
			await element(by.id('PrevMonth')).tap();
			await expect(element(by.id('Today'))).not.toExist();
			await element(by.id('Day-1')).tap();
			await element(by.id('Day-28')).tap();
			await element(by.id('CalendarApplyButton')).tap();
			await expect(element(by.id('Activity-1'))).not.toExist();

			// calendar, current date, 3 transactions
			await element(by.id('TimeRangePrompt')).tap();
			await element(by.id('CalendarClearButton')).tap();
			await element(by.id('NextMonth')).tap();
			await element(by.id('Today')).tap();
			await element(by.id('CalendarApplyButton')).tap();
			await expect(element(by.id('Activity-3'))).toExist();

			markComplete('o1');
		});
	});
});
