import createLndRpc from '@radar/lnrpc';
import BitcoinJsonRpc from 'bitcoin-json-rpc';
import { device } from 'detox';
import jestExpect from 'expect';
import { encode } from 'bip21';

import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';
import {
	bitcoinURL,
	lndConfig,
	checkComplete,
	completeOnboarding,
	electrumHost,
	electrumPort,
	launchAndWait,
	markComplete,
	sleep,
	receiveOnchainFunds,
	waitForActiveChannel,
	waitForPeerConnection,
	isButtonEnabled,
} from './helpers';

d = checkComplete(['send-1', 'send-2']) ? describe.skip : describe;

d('Send', () => {
	let waitForElectrum;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
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
		await device.launchApp({ delete: true });
		await completeOnboarding();
		await launchAndWait();
		await waitForElectrum();
	});

	afterAll(() => {
		waitForElectrum?.close();
	});

	it('Validates payment data in the manual input', async () => {
		if (checkComplete('send-1')) {
			return;
		}

		const button = element(by.id('AddressContinue'));
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();

		// check validation for empty address
		let buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// check validation for invalid data
		await element(by.id('RecipientInput')).replaceText('test123');
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// check validation for invalid address (network mismatch)
		const mainnetAddress = 'bc1qnc8at2e2navahnz7lvtl39r4dnfzxv3cc9e7ax';
		await element(by.id('RecipientInput')).replaceText(mainnetAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// check validation for address when balance is 0
		const address = await rpc.getNewAddress();
		await element(by.id('RecipientInput')).replaceText(address);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// check validation for expired invoice
		const invoice =
			'lnbcrt1pn3zpqpdqqnp4qfh2x8nyvvzq4kf8j9wcaau2chr580l93pnyrh5027l8f7qtm48h6pp5lmwkulnpze4ek4zqwfepguahcr2ma3vfhwa6uepxfd378xlldprssp5wnq34d553g50suuvfy387csx5hx6mdv8zezem6f4tky7rhezycas9qyysgqcqpcxqrrssrzjqtr7pzpunxgwjddwdqucegdphm6776xcarz60gw9gxva0rhal5ntmapyqqqqqqqqpqqqqqlgqqqqqqgq2ql9zpeakxvff9cz5rd6ssc3cngl256u8htm860qv3r28vqkwy9xe3wp0l9ms3zcqvys95yf3r34ytmegz6zynuthh5s0kh7cueunm3mspg3uwpt';
		await element(by.id('RecipientInput')).replaceText(invoice);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// TODO: check validation for lnurl
		// const lnurl =
		// 	'lnurl1dp68gup69uhkcmmrv9kxsmmnwsarxvpsxqcj7mrww4exc0m385ukvv35v43kyetrx5enqcfcx93r2vtzv93kxcnrvdjxxefkvdnxzcmz8yurxcm98qcnqcfkv56kxvfhvgukye3jvvck2de5x43rqwf3xujlyx';
		// await element(by.id('RecipientInput')).replaceText(lnurl);
		// await element(by.id('RecipientInput')).tapReturnKey();
		// buttonEnabled = await isButtonEnabled(button);
		// jestExpect(buttonEnabled).toBe(true);

		// check validation for slashtag with empty pay config
		const slashpay =
			'slash:9n31tfs4ibg9mqdqzhzwwutbm6nr8e4qxkokyam7mh7a78fkmqmo/profile.json?relay=https://dht-relay.synonym.to/staging/web-relay';
		await element(by.id('RecipientInput')).replaceText(slashpay);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// check validation for node connection URI
		const nodeUri =
			'0399537c06f0d03e9c75f9116a7709ea608a4db78e7bce9fef09e8c3bbbfed12f7@0.0.0.0:9735';
		await element(by.id('RecipientInput')).replaceText(nodeUri);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// Receive funds and check validation w/ balance
		await element(by.id('SendSheet')).swipe('down');
		await receiveOnchainFunds(rpc);

		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();

		// check validation for address
		const address2 = await rpc.getNewAddress();
		await element(by.id('RecipientInput')).replaceText(address2);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(true);

		// check validation for unified invoice when balance is enough
		const unified1 =
			'bitcoin:bcrt1q07x3wl76zdxvdsz3qzzkvxrjg3n6t4tz2vnsx8?amount=0.0001';
		await element(by.id('RecipientInput')).replaceText(unified1);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(true);

		// check validation for unified invoice when balance is too low
		const unified2 =
			'bitcoin:bcrt1q07x3wl76zdxvdsz3qzzkvxrjg3n6t4tz2vnsx8?amount=0.002';
		await element(by.id('RecipientInput')).replaceText(unified2);
		await element(by.id('RecipientInput')).tapReturnKey();
		buttonEnabled = await isButtonEnabled(button);
		// jestExpect(buttonEnabled).toBe(false);
		jestExpect(buttonEnabled).toBe(true);

		markComplete('send-1');
	});

	it.only('Can receive funds and send to different invoices', async () => {
		// Test plan:
		// Prepare
		// - receive onchain funds
		// - open channel to LND node
		// - receive lightning funds

		// Send
		// - send to onchain address
		// - send to lightning invoice
		// - send to unified invoice

		// - check balances, tx history and notes
		// - restore wallet
		// - check balances, tx history and notes
		// - close channel

		if (checkComplete('send-2')) {
			return;
		}

		await receiveOnchainFunds(rpc);

		// send funds to LND node and open a channel
		const lnd = await createLndRpc(lndConfig);
		const { address: lndAddress } = await lnd.newAddress();
		await rpc.sendToAddress(lndAddress, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();
		const { identityPubkey: lndNodeID } = await lnd.getInfo();

		// get LDK Node id
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).tap();
		// wait for LDK to start
		await sleep(5000);
		await element(by.id('LightningNodeInfo')).tap();
		await waitFor(element(by.id('LDKNodeID')))
			.toBeVisible()
			.withTimeout(60000);
		let { label: ldkNodeId } = await element(
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
		await waitForElectrum();

		// wait for channel to be active
		await waitForActiveChannel(lnd, ldkNodeId);

		// check channel status
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).atIndex(0).tap();
		await element(by.id('Channels')).tap();
		await element(by.id('Channel')).atIndex(0).tap();
		await expect(
			element(by.id('MoneyText').withAncestor(by.id('TotalSize'))),
		).toHaveText('100 000');
		await element(by.id('ChannelScrollView')).scrollTo('bottom', NaN, 0.1);
		await expect(element(by.id('IsUsableYes'))).toBeVisible();
		await element(by.id('NavigationClose')).atIndex(0).tap();
		await sleep(500);

		// receive lightning funds
		await element(by.id('Receive')).tap();
		let { label: invoice1 } = await element(by.id('QRCode')).getAttributes();
		invoice1 = invoice1.replaceAll(/bitcoin.*=/gi, '').toLowerCase();
		await lnd.sendPaymentSync({ paymentRequest: invoice1, amt: 50000 });
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down');

		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('150 000')
			.withTimeout(10000);

		// send to onchain address
		const { address: onchainAddress } = await lnd.newAddress();
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(onchainAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(1000); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await expect(element(by.id('AssetButton-savings'))).toBeVisible();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(5);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('139 502')
			.withTimeout(10000);

		// send to lightning invoice
		const { paymentRequest } = await lnd.addInvoice({ memo: 'zero' });
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(paymentRequest);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(1000); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await expect(element(by.id('AssetButton-spending'))).toBeVisible();
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
			.toHaveText('139 391')
			.withTimeout(10000);

		// send to unified invoice
		const label = 'unified';
		const { paymentRequest: lnInvoice2 } = await lnd.addInvoice({
			value: 10000,
			memo: label,
		});
		const unified = encode(onchainAddress, {
			lightning: lnInvoice2,
			amount: 10000,
			label,
		});

		console.log({ unified });

		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(unified);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(1000); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await expect(element(by.id('AssetButton-spending'))).toBeVisible();
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
			.toHaveText('139 391')
			.withTimeout(10000);

		// // check tx history
		// await element(by.id('WalletsScrollView')).scroll(1000, 'down', NaN, 0.85);
		// await expect(
		// 	element(by.text('1 000').withAncestor(by.id('ActivityShort-1'))),
		// ).toBeVisible();
		// await expect(
		// 	element(by.text('111').withAncestor(by.id('ActivityShort-2'))),
		// ).toBeVisible();
		// await expect(
		// 	element(by.text('111').withAncestor(by.id('ActivityShort-3'))),
		// ).toBeVisible();
		// await element(by.id('ActivityShort-2')).tap();
		// await expect(element(by.id('InvoiceNote'))).toHaveText(note2);
		// await element(by.id('NavigationClose')).tap();
		// await element(by.id('ActivityShort-3')).tap();
		// await expect(element(by.id('InvoiceNote'))).toHaveText(note1);
		// await element(by.id('NavigationClose')).tap();

		// // check activity filters & tags
		// await element(by.id('ActivityShowAll')).tap();

		// // All, 4 transactions
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
		// ).toHaveText('-');
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
		// ).toHaveText('-');
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-3'))),
		// ).toHaveText('+');
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-4'))),
		// ).toHaveText('+');
		// await expect(element(by.id('Activity-5'))).not.toExist();

		// // Sent, 2 transactions
		// await element(by.id('Tab-sent')).tap();
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
		// ).toHaveText('-');
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
		// ).toHaveText('-');
		// await expect(element(by.id('Activity-3'))).not.toExist();

		// // Received, 2 transactions
		// await element(by.id('Tab-received')).tap();
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
		// ).toHaveText('+');
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-2'))),
		// ).toHaveText('+');
		// await expect(element(by.id('Activity-3'))).not.toExist();

		// // Other, 0 transactions
		// await element(by.id('Tab-other')).tap();
		// await expect(element(by.id('Activity-1'))).not.toExist();

		// // filter by receive tag
		// await element(by.id('Tab-all')).tap();
		// await element(by.id('TagsPrompt')).tap();
		// await element(by.id('Tag-rtag')).tap();
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
		// ).toHaveText('+');
		// await expect(element(by.id('Activity-2'))).not.toExist();
		// await element(by.id('Tag-rtag-delete')).tap();

		// // filter by send tag
		// await element(by.id('TagsPrompt')).tap();
		// await element(by.id('Tag-stag')).tap();
		// await expect(
		// 	element(by.id('MoneySign').withAncestor(by.id('Activity-1'))),
		// ).toHaveText('-');
		// await expect(element(by.id('Activity-2'))).not.toExist();
		// await element(by.id('Tag-stag-delete')).tap();
		// await element(by.id('NavigationClose')).tap();

		// // get seed
		// await element(by.id('Settings')).tap();
		// await element(by.id('BackupSettings')).tap();
		// await element(by.id('BackupWallet')).tap();
		// await sleep(1000); // animation
		// await element(by.id('TapToReveal')).tap();

		// // get the seed from SeedContaider
		// const { label: seed } = await element(
		// 	by.id('SeedContaider'),
		// ).getAttributes();
		// await element(by.id('SeedContaider')).swipe('down');
		// await sleep(1000); // animation
		// await element(by.id('NavigationClose')).atIndex(0).tap();

		// await sleep(5000); // make sure everything is saved to cloud storage TODO: improve this
		// console.info('seed: ', seed);

		// // restore wallet
		// await device.launchApp({ delete: true });

		// await waitFor(element(by.id('Check1'))).toBeVisible();
		// await element(by.id('Check1')).tap();
		// await element(by.id('Check2')).tap();
		// await element(by.id('Continue')).tap();
		// await waitFor(element(by.id('SkipIntro'))).toBeVisible();
		// await element(by.id('SkipIntro')).tap();
		// await element(by.id('RestoreWallet')).tap();
		// await element(by.id('MultipleDevices-button')).tap();
		// await element(by.id('Word-0')).replaceText(seed);
		// await element(by.id('WordIndex-4')).swipe('up');
		// await element(by.id('RestoreButton')).tap();

		// await waitFor(element(by.id('GetStartedButton')))
		// 	.toBeVisible()
		// 	.withTimeout(300000); // 5 min
		// await element(by.id('GetStartedButton')).tap();

		// // wait for SuggestionsLabel to appear and be accessible
		// for (let i = 0; i < 60; i++) {
		// 	await sleep(1000);
		// 	try {
		// 		await element(by.id('SuggestionsLabel')).tap();
		// 		break;
		// 	} catch (e) {}
		// }

		// // check balance
		// await waitFor(
		// 	element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		// )
		// 	.toHaveText('49 000')
		// 	.withTimeout(10000);

		// // check tx history
		// await element(by.id('WalletsScrollView')).scroll(1000, 'down', NaN, 0.85);
		// await expect(
		// 	element(by.text('111').withAncestor(by.id('ActivityShort-2'))),
		// ).toBeVisible();
		// await element(by.id('ActivityShort-2')).tap();
		// await expect(element(by.id('InvoiceNote'))).toHaveText(note2);
		// await element(by.id('NavigationClose')).tap();

		// // check channel status
		// await element(by.id('Settings')).tap();
		// await element(by.id('AdvancedSettings')).tap();
		// await sleep(100);
		// await element(by.id('Channels')).tap();
		// await element(by.id('Channel')).atIndex(0).tap();
		// await element(by.id('ChannelScrollView')).scrollTo('bottom', NaN, 0.1);
		// await expect(element(by.id('IsUsableYes'))).toBeVisible();

		// // close channel
		// await element(by.id('CloseConnection')).tap();
		// await element(by.id('CloseConnectionButton')).tap();

		// // FIXME: closing doesn't work, because channel is not ready yet
		// if (device.getPlatform() === 'android') {
		// 	markComplete('send-2');
		// 	return;
		// }

		// await rpc.generateToAddress(6, await rpc.getNewAddress());
		// await waitForElectrum();
		// await expect(element(by.id('Channel')).atIndex(0)).not.toExist();
		// await element(by.id('NavigationBack')).atIndex(0).tap();
		// await element(by.id('NavigationClose')).atIndex(0).tap();

		// // TODO: for some reason this doen't work on github actions
		// // wait for onchain payment to arrive
		// // await waitFor(element(by.id('NewTxPrompt')))
		// // 	.toBeVisible()
		// // 	.withTimeout(60000);
		// // await element(by.id('NewTxPrompt')).swipe('down');
		// // await expect(
		// // 	element(by.id('MoneySign').withAncestor(by.id('ActivityShort-1'))),
		// // ).toHaveText('+');

		markComplete('send-2');
	});
});
