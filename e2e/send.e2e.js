import createLndRpc from '@radar/lnrpc';
import BitcoinJsonRpc from 'bitcoin-json-rpc';
import { device } from 'detox';
import jestExpect from 'expect';
import { encode } from 'bip21';

import initElectrum from './electrum';
import {
	bitcoinURL,
	lndConfig,
	checkComplete,
	completeOnboarding,
	launchAndWait,
	markComplete,
	sleep,
	receiveOnchainFunds,
	waitForActiveChannel,
	waitForPeerConnection,
	isButtonEnabled,
} from './helpers';

d = checkComplete(['send-1', 'send-2']) ? describe.skip : describe;

const enterAddress = async (address) => {
	await element(by.id('Send')).tap();
	await element(by.id('RecipientManual')).tap();
	await element(by.id('RecipientInput')).replaceText(address);
	await element(by.id('RecipientInput')).tapReturnKey();
	// wait for keyboard to hide
	await sleep(1000);
	await element(by.id('AddressContinue')).tap();
};

d('Send', () => {
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
	});

	beforeEach(async () => {
		await device.launchApp({ delete: true });
		await completeOnboarding();
		await launchAndWait();
		await electrum?.waitForSync();
	});

	afterAll(() => {
		electrum?.stop();
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
		jestExpect(buttonEnabled).toBe(true);

		markComplete('send-1');
	});

	it('Can receive funds and send to different invoices', async () => {
		// Test plan:
		// Prepare
		// - receive onchain funds
		// - open channel to LND node
		// - receive lightning funds

		// Send
		// - send to onchain address
		// - send to lightning invoice
		// - send to unified invoice
		// - quickpay to lightning invoice
		// - quickpay to unified invoice

		if (checkComplete('send-2')) {
			return;
		}

		await receiveOnchainFunds(rpc);

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

		// receive lightning funds
		await element(by.id('Receive')).tap();
		let { label: receive } = await element(by.id('QRCode')).getAttributes();
		receive = receive.replaceAll(/bitcoin.*=/gi, '').toLowerCase();
		await lnd.sendPaymentSync({ paymentRequest: receive, amt: 50000 });
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
		await enterAddress(onchainAddress);
		await expect(element(by.id('AssetButton-savings'))).toBeVisible();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
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
		const { paymentRequest: invoice1 } = await lnd.addInvoice();
		await enterAddress(invoice1);
		await expect(element(by.id('AssetButton-spending'))).toBeVisible();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('129 502')
			.withTimeout(10000);

		// can edit invoice on the review screen
		const { paymentRequest: invoice2 } = await lnd.addInvoice({ value: 10000 });
		await enterAddress(invoice2);
		let attributes = await element(
			by.id('ReviewAmount-primary'),
		).getAttributes();
		let amount = attributes.label;
		jestExpect(amount).toBe('10 000');
		await element(by.id('ReviewUri')).tap();
		await element(by.id('RecipientInput')).replaceText(onchainAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await element(by.id('AddressContinue')).tap();
		await expect(element(by.id('AssetButton-savings'))).toBeVisible();
		await element(by.id('N2').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		attributes = await element(by.id('ReviewAmount-primary')).getAttributes();
		amount = attributes.label;
		jestExpect(amount).toBe('20 000');
		await element(by.id('SendSheet')).swipe('down');

		// send to unified invoice w/ amount
		const { paymentRequest: invoice3 } = await lnd.addInvoice({ value: 10000 });
		const unified1 = encode(onchainAddress, {
			lightning: invoice3,
			amount: 10000,
		});

		await enterAddress(unified1);
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('119 502')
			.withTimeout(10000);

		// send to unified invoice w/ amount exceeding balance(s)
		const { paymentRequest: invoice4 } = await lnd.addInvoice({
			value: 200000,
		});
		const unified2 = encode(onchainAddress, {
			lightning: invoice4,
			amount: 200000,
		});

		await enterAddress(unified2);
		// should only allow spending from savings and sets invoice amount to 0
		await expect(element(by.id('AssetButton-savings'))).toBeVisible();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('109 004')
			.withTimeout(10000);

		// send to unified invoice w/ expired invoice
		const unified3 =
			'bitcoin:bcrt1qaytrqsrgg75rtxrtr7ur6k75la8p3v95mey48z?lightning=LNBCRT1PN33T20DQQNP4QTNTQ4D2DHDYQ420HAUQF5TS7X32TNW9WGYEPQZQ6R9G69QPHW4RXPP5QU7UYXJYJA9PJV7H6JPEYEFFNZ98N686JDEAAK8AUD5AGC5X70HQSP54V5LEFATCQDEU8TLKAF6MDK3ZLU6MWUA52J4JEMD5XA85KGKMTTQ9QYYSGQCQPCXQRRSSRZJQWU6G4HMGH26EXXQYPQD8XHVWLARA66PL53V7S9CV2EE808UGDRN4APYQQQQQQQGRCQQQQLGQQQQQQGQ2QX7F74RT5SQE0KEYCU47LYMSVY2LM4QA4KLR65PPSY55M0H4VR8AN7WVM9EFVSPYJ5R8EFGVXTGVATAGFTC372VRJ3HEPSEELFZ7FQFCQ9XDU9X';

		await enterAddress(unified3);
		await expect(element(by.id('AssetButton-savings'))).toBeVisible();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('98 506')
			.withTimeout(10000);

		// send to unified invoice w/o amount (lightning)
		const { paymentRequest: invoice5 } = await lnd.addInvoice();
		const unified4 = encode(onchainAddress, { lightning: invoice5 });

		await enterAddress(unified4);
		// max amount (lightning)
		await expect(element(by.text('28 900'))).toBeVisible();
		await element(by.id('AssetButton-switch')).tap();
		// max amount (onchain)
		await expect(element(by.text('68 008'))).toBeVisible();
		await element(by.id('AssetButton-switch')).tap();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('88 506')
			.withTimeout(10000);

		// send to unified invoice w/o amount (switch to onchain)
		const { paymentRequest: invoice6 } = await lnd.addInvoice();
		const unified5 = encode(onchainAddress, { lightning: invoice6 });

		await enterAddress(unified5);

		// max amount (lightning)
		await element(by.id('AvailableAmount')).tap();
		await element(by.id('ContinueAmount')).tap();
		await expect(element(by.text('18 900'))).toBeVisible();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		// max amount (onchain)
		await element(by.id('AssetButton-switch')).tap();
		await element(by.id('AvailableAmount')).tap();
		await element(by.id('ContinueAmount')).tap();
		await expect(element(by.text('68 008'))).toBeVisible();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		await element(
			by.id('NRemove').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(5);
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N0').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(4);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('78 008')
			.withTimeout(10000);

		// send to lightning invoice w/ amount (quickpay)
		const { paymentRequest: invoice7 } = await lnd.addInvoice({ value: 1000 });

		// enable quickpay
		await element(by.id('HeaderMenu')).tap();
		await element(by.id('DrawerSettings')).tap();
		await element(by.id('GeneralSettings')).tap();
		await element(by.id('QuickpaySettings')).tap();
		await element(by.id('QuickpayIntro-button')).tap();
		await element(by.id('QuickpayToggle')).tap();
		await element(by.id('NavigationClose')).tap();

		await enterAddress(invoice7);
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('77 008')
			.withTimeout(10000);

		// send to unified invoice w/ amount (quickpay)
		const { paymentRequest: invoice8 } = await lnd.addInvoice({ value: 1000 });
		const unified7 = encode(onchainAddress, {
			lightning: invoice8,
			amount: 1000,
		});

		await enterAddress(unified7);
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('76 008')
			.withTimeout(10000);

		// send to lightning invoice w/ amount (skip quickpay for large amounts)
		const { paymentRequest: invoice9 } = await lnd.addInvoice({ value: 10000 });
		await enterAddress(invoice9);
		await expect(element(by.id('ReviewAmount'))).toBeVisible();
		await element(by.id('SendSheet')).swipe('down');

		markComplete('send-2');
	});
});
