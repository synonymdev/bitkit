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
		// Test plan
		// - can receive to 2 addresses and tag them
		// - shows correct total balance
		// - can send total balance and tag the tx
		// - no exceeding availableAmount
		// - shows a warning for sending over 50% of total
		// - avoid creating dust output
		// - TODO: coin selectiom

		it('Can receive 2 transactions and send them all at once', async () => {
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
			await element(by.id('AddressOrSlashpay')).replaceText(coreAddress);
			await element(by.id('AddressOrSlashpay')).tapReturnKey();
			await sleep(2000); // validation
			await element(by.id('ContinueRecipient')).tap();

			// Amount / NumberPad
			await element(by.id('SendNumberPadMax')).tap();
			await element(
				by.id('NRemove').withAncestor(by.id('SendAmountNumberPad')),
			).multiTap(3);
			// Switch to BTC
			await element(by.id('SendNumberPadUnit')).multiTap(2);
			await expect(element(by.text('0.00199999'))).toBeVisible();
			// Switch to sats
			await element(by.id('SendNumberPadUnit')).multiTap(1);
			await element(
				by.id('N9').withAncestor(by.id('SendAmountNumberPad')),
			).multiTap(5);
			await expect(element(by.text('19 999 999'))).toBeVisible();
			await element(by.id('SendNumberPadMax')).tap();
			await element(by.id('ContinueAmount')).tap();

			// Review & Send
			await expect(element(by.id('TagsAddSend'))).toBeVisible();
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

			// balance should be 0
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

		it('Avoids creating a dust output and instead adds it to the fee', async () => {
			if (checkComplete('o2')) {
				return;
			}

			await element(by.id('Receive')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');

			await rpc.sendToAddress(wAddress, '1');
			// await rpc.generateToAddress(1, await rpc.getNewAddress());
			// await waitForElectrum();

			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
			await sleep(1000); // animation

			const coreAddress = await rpc.getNewAddress();
			await element(by.id('Send')).tap();
			await sleep(1000); // animation
			await element(by.id('AddressOrSlashpay')).replaceText(coreAddress);
			await element(by.id('AddressOrSlashpay')).tapReturnKey();
			await sleep(2000); // validation
			await element(by.id('ContinueRecipient')).tap();

			// enter amount that would leave dust
			let { label: amount } = await element(
				by.id('MoneyPrimary').withAncestor(by.id('AvailableAmount')),
			).getAttributes();
			amount = amount.replace(/\s/g, '');
			amount = amount - 300;
			for (const num of String(amount)) {
				await element(
					by.id(`N${num}`).withAncestor(by.id('SendAmountNumberPad')),
				).tap();
			}
			await element(by.id('ContinueAmount')).tap();

			// Review & Send
			await element(by.id('GRAB')).swipe('right'); // Swipe to confirm

			// TODO: check correct fee

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
			await sleep(1000); // animation

			// balance should be 0
			await expect(
				element(by.id('MoneyPrimary').withAncestor(by.id('TotalBalance'))),
			).toHaveText('0');

			// check number of outputs for send tx
			await element(by.id('AssetsTitle')).swipe('up');
			await expect(element(by.id('ActivityShort-1'))).toBeVisible();
			await expect(element(by.id('ActivityShort-2'))).toBeVisible();
			await element(by.id('ActivityShowAll')).tap();
			await element(by.id('Activity-1')).tap();
			await element(by.id('ActivityTxDetails')).tap();
			// only 1 output -> no dust
			await expect(element(by.text('1 OUTPUT'))).toBeVisible();

			markComplete('o2');
		});
	});
});
