import createLndRpc from '@radar/lnrpc';
import BitcoinJsonRpc from 'bitcoin-json-rpc';
import { device } from 'detox';

import initElectrum from './electrum';
import {
	bitcoinURL,
	lndConfig,
	checkComplete,
	completeOnboarding,
	launchAndWait,
	markComplete,
	sleep,
	waitForActiveChannel,
	waitForPeerConnection,
	restoreWallet,
	getSeed,
	waitForBackup,
} from './helpers';

d = checkComplete('lighting-1') ? describe.skip : describe;

d('Lightning', () => {
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
		// Test plan:
		// - connect to LND node
		// - receive funds
		// - send funds
		// - check balances, tx history and notes
		// - restore wallet
		// - check balances, tx history and notes
		// - close channel

		it('Can receive and send LN payments', async () => {
			if (checkComplete('lighting-1')) {
				return;
			}

			// send funds to LND node and open a channel
			const lnd = await createLndRpc(lndConfig);
			const { address: lndAddress } = await lnd.newAddress();
			await rpc.sendToAddress(lndAddress, '1');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await electrum?.waitForSync();
			const { identityPubkey: lndNodeID } = await lnd.getInfo();

			// get LDK Node id
			await element(by.id('HeaderMenu')).tap();
			await element(by.id('DrawerSettings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			// wait for LDK to start
			await sleep(5000);
			await element(by.id('LightningNodeInfo')).tap();
			await waitFor(element(by.id('LDKNodeID')))
				.toBeVisible()
				.withTimeout(60000);
			const { label: ldkNodeId } = await element(
				by.id('LDKNodeID'),
			).getAttributes();
			await element(by.id('NavigationBack')).atIndex(0).tap();

			// connect to LND
			await element(by.id('Channels')).tap();
			await element(by.id('NavigationAction')).tap();
			await element(by.id('FundCustom')).tap();
			await element(by.id('FundManual')).tap();
			await element(by.id('NodeIdInput')).replaceText(lndNodeID);
			await element(by.id('HostInput')).replaceText('0.0.0.0');
			await element(by.id('PortInput')).replaceText('9735');
			await element(by.id('PortInput')).tapReturnKey();
			await element(by.id('ExternalContinue')).tap();
			await element(by.id('NavigationClose')).tap();

			// wait for peer to be connected
			await waitForPeerConnection(lnd, ldkNodeId);

			// open a channel
			await lnd.openChannelSync({
				nodePubkeyString: ldkNodeId,
				localFundingAmount: '100000',
				private: true,
			});
			await rpc.generateToAddress(6, await rpc.getNewAddress());
			await electrum?.waitForSync();

			// wait for channel to be active
			await waitForActiveChannel(lnd, ldkNodeId);

			// check channel status
			await element(by.id('HeaderMenu')).tap();
			await element(by.id('DrawerSettings')).tap();
			await element(by.id('AdvancedSettings')).atIndex(0).tap();
			await element(by.id('Channels')).tap();
			await element(by.id('Channel')).atIndex(0).tap();
			await expect(
				element(by.id('MoneyText').withAncestor(by.id('TotalSize'))),
			).toHaveText('100 000');
			await element(by.id('ChannelScrollView')).scrollTo('bottom', Number.NaN, 0.1);
			await expect(element(by.id('IsUsableYes'))).toBeVisible();
			await element(by.id('NavigationClose')).atIndex(0).tap();

			await sleep(500);
			// send funds to LDK, 0 invoice
			await element(by.id('Receive')).tap();
			let { label: invoice1 } = await element(by.id('QRCode')).getAttributes();
			invoice1 = invoice1.replaceAll(/bitcoin.*=/gi, '').toLowerCase();
			await lnd.sendPaymentSync({ paymentRequest: invoice1, amt: 50000 });
			await waitFor(element(by.id('ReceivedTransaction')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('ReceivedTransaction')).swipe('down');
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			)
				.toHaveText('50 000')
				.withTimeout(10000);

			// send funds to LDK, 111 sats invoice
			await element(by.id('Receive')).tap();
			await element(by.id('SpecifyInvoiceButton')).tap();
			await element(by.id('ReceiveNumberPadTextField')).tap();
			await sleep(100);
			await element(
				by.id('N1').withAncestor(by.id('ReceiveNumberPad')),
			).multiTap(3);
			await element(by.id('ReceiveNumberPadSubmit')).tap();
			const note1 = 'note 111';
			await element(by.id('ReceiveNote')).typeText(note1);
			await element(by.id('ReceiveNote')).tapReturnKey();
			await sleep(300); // wait for keyboard to hide
			await element(by.id('TagsAdd')).tap();
			await element(by.id('TagInputReceive')).typeText('rtag');
			await element(by.id('TagInputReceive')).tapReturnKey();
			await sleep(300); // wait for keyboard to hide
			await element(by.id('ShowQrReceive')).tap();
			await element(by.id('QRCode')).swipe('left');
			const { label: invoice2 } = await element(
				by.id('ReceiveLightningInvoice'),
			).getAttributes();
			await lnd.sendPaymentSync({ paymentRequest: invoice2 });
			await waitFor(element(by.id('ReceivedTransaction')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('ReceivedTransaction')).swipe('down');
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			)
				.toHaveText('50 111')
				.withTimeout(10000);

			// send funds to LND, 0 invoice
			const note2 = 'zero';
			const { paymentRequest: invoice3 } = await lnd.addInvoice({
				memo: note2,
			});
			await element(by.id('Send')).tap();
			await element(by.id('RecipientManual')).tap();
			await element(by.id('RecipientInput')).replaceText(invoice3);
			await element(by.id('RecipientInput')).tapReturnKey();
			await sleep(1000); // wait for keyboard to hide
			await element(by.id('AddressContinue')).tap();
			await element(
				by.id('N1').withAncestor(by.id('SendAmountNumberPad')),
			).multiTap(3);
			await element(by.id('ContinueAmount')).tap();
			await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
			await waitFor(element(by.id('SendSuccess')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('Close')).tap();
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			)
				.toHaveText('50 000')
				.withTimeout(10000);

			// send funds to LND, 10000 invoice
			const value = 1000;
			const { paymentRequest: invoice4 } = await lnd.addInvoice({
				value: value,
			});
			await element(by.id('Send')).tap();
			await element(by.id('RecipientManual')).tap();
			await element(by.id('RecipientInput')).replaceText(invoice4);
			await element(by.id('RecipientInput')).tapReturnKey();
			await sleep(1000); // wait for keyboard to hide
			await element(by.id('AddressContinue')).tap();

			// Review & Send
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('ReviewAmount-primary'))),
			).toHaveText(value.toString());
			await expect(element(by.id('TagsAddSend'))).toBeVisible();
			await element(by.id('TagsAddSend')).tap(); // add tag
			await element(by.id('TagInputSend')).typeText('stag');
			await element(by.id('TagInputSend')).tapReturnKey();
			await sleep(500); // wait for keyboard to close
			await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
			await waitFor(element(by.id('SendSuccess')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('Close')).tap();
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			)
				.toHaveText('49 000')
				.withTimeout(10000);

			// check tx history
			await element(by.id('HomeScrollView')).scroll(1000, 'down', 0, 0.5);
			await expect(
				element(by.text('1 000').withAncestor(by.id('ActivityShort-1'))),
			).toBeVisible();
			await expect(
				element(by.text('111').withAncestor(by.id('ActivityShort-2'))),
			).toBeVisible();
			await expect(
				element(by.text('111').withAncestor(by.id('ActivityShort-3'))),
			).toBeVisible();
			await element(by.id('ActivityShort-2')).tap();
			await expect(element(by.id('InvoiceNote'))).toHaveText(note2);
			await element(by.id('NavigationClose')).tap();
			await element(by.id('ActivityShort-3')).tap();
			await expect(element(by.id('InvoiceNote'))).toHaveText(note1);
			await element(by.id('NavigationClose')).tap();

			// check activity filters & tags
			await element(by.id('ActivityShowAll')).tap();

			// All, 4 transactions
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
			).toHaveText('-');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-3'))),
			).toHaveText('+');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-4'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-5'))).not.toExist();

			// Sent, 2 transactions
			await element(by.id('Tab-sent')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
			).toHaveText('-');
			await expect(element(by.id('Activity-3'))).not.toExist();

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

			// filter by receive tag
			await element(by.id('Tab-all')).tap();
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('Tag-rtag')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('+');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('Tag-rtag-delete')).tap();

			// filter by send tag
			await element(by.id('TagsPrompt')).tap();
			await element(by.id('Tag-stag')).tap();
			await expect(
				element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
			).toHaveText('-');
			await expect(element(by.id('Activity-2'))).not.toExist();
			await element(by.id('Tag-stag-delete')).tap();
			await element(by.id('NavigationClose')).tap();

			// wipe and restore wallet
			const seed = await getSeed();
			await waitForBackup();
			await restoreWallet(seed);

			// check balance
			await waitFor(
				element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
			)
				.toHaveText('49 000')
				.withTimeout(10000);

			// check tx history
			await element(by.id('HomeScrollView')).scroll(1000, 'down', 0, 0.5);
			await expect(
				element(by.text('111').withAncestor(by.id('ActivityShort-2'))),
			).toBeVisible();
			await element(by.id('ActivityShort-2')).tap();
			await expect(element(by.id('InvoiceNote'))).toHaveText(note2);
			await element(by.id('NavigationClose')).tap();

			// check channel status
			await element(by.id('HeaderMenu')).tap();
			await element(by.id('DrawerSettings')).tap();
			await element(by.id('AdvancedSettings')).tap();
			await sleep(100);
			await element(by.id('Channels')).tap();
			await element(by.id('Channel')).atIndex(0).tap();
			await element(by.id('ChannelScrollView')).scrollTo('bottom', Number.NaN, 0.1);
			await expect(element(by.id('IsUsableYes'))).toBeVisible();

			// close channel
			await element(by.id('CloseConnection')).tap();
			await element(by.id('CloseConnectionButton')).tap();

			// FIXME: closing doesn't work, because channel is not ready yet
			if (device.getPlatform() === 'android') {
				markComplete('lighting-1');
				return;
			}

			await rpc.generateToAddress(6, await rpc.getNewAddress());
			await electrum?.waitForSync();
			await expect(element(by.id('Channel')).atIndex(0)).not.toExist();
			await element(by.id('NavigationBack')).atIndex(0).tap();
			await element(by.id('NavigationClose')).atIndex(0).tap();

			// TODO: for some reason this doen't work on github actions
			// wait for onchain payment to arrive
			// await waitFor(element(by.id('ReceivedTransaction')))
			// 	.toBeVisible()
			// 	.withTimeout(60000);
			// await element(by.id('ReceivedTransaction')).swipe('down');
			// await expect(
			// 	element(by.id('MoneySign').withAncestor(by.id('ActivityShort-1'))),
			// ).toHaveText('+');

			markComplete('lighting-1');
		});
	});
});
