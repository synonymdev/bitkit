import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
} from './helpers';
import initElectrum from './electrum';

d = checkComplete(['onchain-1', 'onchain-2']) ? describe.skip : describe;

d('Onchain', () => {
	let electrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}

		electrum = await initElectrum();

		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
		await electrum?.waitForSync();
	});

	afterEach(() => {
		electrum?.stop();
	});

	d('Receive and Send', () => {
		// Test plan
		// - can receive to 2 addresses and tag them
		// - shows correct total balance
		// - can send total balance and tag the tx
		// - no exceeding availableAmount
		// - shows warnings for sending over 100$ or 50% of total
		// - avoid creating dust output
		// - TODO: coin selectiom

		it('Can receive 2 transactions and send them all at once', async () => {
			if (checkComplete('onchain-1')) {
				return;
			}

			for (let i = 0; i < 2; i++) {
				await element(by.id('Receive')).tap();
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
				await sleep(300); // wait for keyboard to hide
				await element(by.id('ShowQrReceive')).tap();

				await rpc.sendToAddress(wAddress, '1');
				await rpc.generateToAddress(1, await rpc.getNewAddress());
				await electrum?.waitForSync();

				await waitFor(element(by.id('ReceivedTransaction')))
					.toBeVisible()
					.withTimeout(10000);
				await element(by.id('ReceivedTransaction')).swipe('down'); // close Receive screen
				await sleep(1000); // animation
			}

			// balance should be 2 bitcoins
			await expect(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			).toHaveText('200 000 000');

			const coreAddress = await rpc.getNewAddress();
			await element(by.id('Send')).tap();
			await element(by.id('RecipientManual')).tap();
			await element(by.id('RecipientInput')).replaceText(coreAddress);
			await element(by.id('RecipientInput')).tapReturnKey();
			await sleep(1000); // wait for keyboard to hide
			await element(by.id('AddressContinue')).tap();

			// Amount / NumberPad
			await element(by.id('AvailableAmount')).tap();
			// cat't use .multitap here, doesn't work properly
			// maybe some race condition in beignet library ?
			await element(
				by.id('NRemove').withAncestor(by.id('SendAmountNumberPad')),
			).tap();
			await element(
				by.id('NRemove').withAncestor(by.id('SendAmountNumberPad')),
			).tap();
			await element(
				by.id('NRemove').withAncestor(by.id('SendAmountNumberPad')),
			).tap();
			await expect(element(by.text('199 999'))).toBeVisible();
			await element(by.id('AvailableAmount')).tap();
			await element(by.id('ContinueAmount')).tap();

			// Review & Send
			await expect(element(by.id('TagsAddSend'))).toBeVisible();
			await element(by.id('TagsAddSend')).tap(); // add tag
			await element(by.id('TagInputSend')).typeText('stag');
			await element(by.id('TagInputSend')).tapReturnKey();
			await sleep(500); // wait for keyboard to close
			await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm

			await sleep(1000); // animation
			await waitFor(element(by.id('SendDialog2'))) // sending over 50% of balance warning
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
			await electrum?.waitForSync();
			await sleep(1000); // animation

			// balance should be 0
			await expect(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			).toHaveText('0');

			// check Activity
			await element(by.id('HomeScrollView')).scroll(1000, 'down', 0, 0.5);
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

			// Other, 0 transactions
			await element(by.id('Tab-other')).tap();
			await expect(element(by.id('Activity-1'))).not.toExist();
			await element(by.id('Tab-all')).tap();

			// filter by receive tag
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('Tag-rtag0')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('Tag-rtag0-delete')).tap();

			// filter by send tag
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('Tag-stag')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('Tag-stag-delete')).tap();

			// calendar, previous month, 0 transactions
			await element(by.id('DatePicker')).tap();
			await expect(element(by.id('Today'))).toBeVisible();
			await element(by.id('PrevMonth')).tap();
			await expect(element(by.id('Today'))).not.toExist();
			await element(by.id('Day-1')).tap();
			await element(by.id('Day-28')).tap();
			await element(by.id('CalendarApplyButton')).tap();
			await expect(element(by.id('Activity-1'))).not.toExist();

			// calendar, current date, 3 transactions
			await element(by.id('DatePicker')).tap();
			await element(by.id('CalendarClearButton')).tap();
			await element(by.id('NextMonth')).tap();
			await element(by.id('Today')).tap();
			await element(by.id('CalendarApplyButton')).tap();
			await expect(element(by.id('Activity-3'))).toExist();

			markComplete('onchain-1');
		});

		it('Avoids creating a dust output and instead adds it to the fee', async () => {
			if (checkComplete('onchain-2')) {
				return;
			}

			await element(by.id('Receive')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			await waitFor(element(by.id('QRCode'))).toBeVisible();
			await sleep(100); // wait for qr code to render
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');

			await rpc.sendToAddress(wAddress, '1');
			// await rpc.generateToAddress(1, await rpc.getNewAddress());
			// await electrum?.waitForSync();

			await waitFor(element(by.id('ReceivedTransaction')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('ReceivedTransaction')).swipe('down'); // close Receive screen
			await sleep(1000); // animation

			const coreAddress = await rpc.getNewAddress();

			// enable warning for sending over 100$ to test multiple warning dialogs
			await element(by.id('HeaderMenu')).tap();
			await element(by.id('DrawerSettings')).tap();
			await element(by.id('SecuritySettings')).tap();
			await element(by.id('SendAmountWarning')).tap();
			await element(by.id('NavigationClose')).atIndex(0).tap();

			await element(by.id('Send')).tap();
			await element(by.id('RecipientManual')).tap();
			await element(by.id('RecipientInput')).replaceText(coreAddress);
			await element(by.id('RecipientInput')).tapReturnKey();
			await sleep(1000); // wait for keyboard to hide
			await element(by.id('AddressContinue')).tap();

			// enter amount that would leave dust
			let { label: amount } = await element(
				by.id('MoneyText').withAncestor(by.id('AvailableAmount')),
			).getAttributes();
			amount = amount.replace(/\s/g, '');
			amount = amount - 300;
			for (const num of String(amount)) {
				await sleep(200);
				await element(
					by.id(`N${num}`).withAncestor(by.id('SendAmountNumberPad')),
				).tap();
			}
			await element(by.id('ContinueAmount')).tap();

			// Review & Send
			await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm

			// TODO: check correct fee

			// sending over 50% of balance warning
			await sleep(1000); // animation
			await waitFor(element(by.id('SendDialog2')))
				.toBeVisible()
				.withTimeout(10000);
			await sleep(1000); // animation
			await element(by.id('DialogConfirm')).tap();

			// sending over 100$ warning
			await sleep(1000); // animation
			await waitFor(element(by.id('SendDialog1')))
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
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			).toHaveText('0');

			// check number of outputs for send tx
			await element(by.id('HomeScrollView')).scroll(1000, 'down', 0, 0.5);
			await expect(element(by.id('ActivityShort-1'))).toBeVisible();
			await expect(element(by.id('ActivityShort-2'))).toBeVisible();
			await element(by.id('ActivityShowAll')).tap();
			await element(by.id('Activity-1')).tap();
			await element(by.id('ActivityTxDetails')).tap();
			// only 1 output -> no dust
			await expect(element(by.text('OUTPUT'))).toBeVisible();
			await expect(element(by.text('OUTPUTS (2)'))).not.toBeVisible();

			markComplete('onchain-2');
		});
	});
});
