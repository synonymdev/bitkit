import createLnRpc from '@radar/lnrpc';
import BitcoinJsonRpc from 'bitcoin-json-rpc';
import jestExpect from 'expect';

import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';
import {
	bitcoinURL,
	lndConfig,
	checkComplete,
	completeOnboarding,
	electrumHost,
	electrumPort,
	isButtonEnabled,
	launchAndWait,
	markComplete,
	sleep,
	waitForActiveChannel,
	waitForPeerConnection,
	getSeed,
	restoreWallet,
} from './helpers';

d = checkComplete(['transfer-1', 'transfer-2']) ? describe.skip : describe;

d('Transfer', () => {
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

	afterEach(() => {
		waitForElectrum?.close();
	});

	// Test Plan
	// Can buy a channel from Blocktank with default and custom receive capacity
	// 	- cannot continue with zero spending balance
	// 	- can change amount
	// 	Advanced
	// 	- can change amount
	// Can open a channel to external node
	// 	- open channel to LND
	// 	- send payment
	// 	- close the channel

	it('Can buy a channel from Blocktank with default and custom receive capacity', async () => {
		if (checkComplete('transfer-1')) {
			return;
		}

		// receive BTC
		await element(by.id('Receive')).tap();
		// get address from qrcode
		await waitFor(element(by.id('QRCode'))).toBeVisible();
		await sleep(100); // wait for qr code to render
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');

		await rpc.sendToAddress(wAddress, '0.01');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(20000);
		await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen

		await element(by.id('Suggestion-lightning')).tap();
		await element(by.id('TransferIntro-button')).tap();
		await element(by.id('FundTransfer')).tap();
		await element(by.id('SpendingIntro-button')).tap();

		// default amount is 0
		const button = element(by.id('SpendingAmountContinue'));
		const buttonEnabled = await isButtonEnabled(button);
		jestExpect(buttonEnabled).toBe(false);

		// can continue with max amount
		await element(by.id('SpendingAmountMax')).tap();
		await element(by.id('SpendingAmountContinue')).tap();
		await element(by.id('NavigationBack')).tap();

		// can continue with 25% amount
		await element(by.id('SpendingAmountQuarter')).tap();
		await expect(element(by.text('250 000'))).toBeVisible();
		await element(by.id('SpendingAmountContinue')).tap();
		await expect(element(by.text('250 000'))).toBeVisible();
		await element(by.id('NavigationBack')).tap();
		await element(by.id('NavigationBack')).tap();
		await element(by.id('SpendingIntro-button')).tap();

		// can change amount
		await element(by.id('N2').withAncestor(by.id('SpendingAmount'))).tap();
		await element(by.id('N0').withAncestor(by.id('SpendingAmount'))).multiTap(
			5,
		);
		await element(by.id('SpendingAmountContinue')).tap();
		await expect(element(by.text('200 000'))).toBeVisible();
		await element(by.id('SpendingConfirmMore')).tap();
		await expect(element(by.text('200 000'))).toBeVisible();
		await element(by.id('LiquidityContinue')).tap();

		// Swipe to confirm (set x offset to avoid navigating back)
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
		await waitFor(element(by.id('LightningSettingUp')))
			.toBeVisible()
			.withTimeout(10000);

		// Get another channel with custom receiving capacity
		await element(by.id('NavigationClose')).tap();
		await element(by.id('ActivitySavings')).tap();
		await element(by.id('TransferToSpending')).tap();
		await element(by.id('N1').withAncestor(by.id('SpendingAmount'))).tap();
		await element(by.id('N0').withAncestor(by.id('SpendingAmount'))).multiTap(
			5,
		);
		await element(by.id('SpendingAmountContinue')).tap();
		await expect(element(by.text('100 000'))).toBeVisible();
		await element(by.id('SpendingConfirmAdvanced')).tap();

		// Receiving Capacity
		// can continue with min amount
		await element(by.id('SpendingAdvancedMin')).tap();
		await expect(element(by.text('105 000'))).toBeVisible();
		await element(by.id('SpendingAdvancedContinue')).tap();
		await element(by.id('SpendingConfirmDefault')).tap();
		await element(by.id('SpendingConfirmAdvanced')).tap();

		// can continue with default amount
		await element(by.id('SpendingAdvancedDefault')).tap();
		await element(by.id('SpendingAdvancedContinue')).tap();
		await element(by.id('SpendingConfirmDefault')).tap();
		await element(by.id('SpendingConfirmAdvanced')).tap();

		// can continue with max amount
		await element(by.id('SpendingAdvancedMax')).tap();
		await element(by.id('SpendingAdvancedContinue')).tap();
		await element(by.id('SpendingConfirmDefault')).tap();
		await element(by.id('SpendingConfirmAdvanced')).tap();

		// can set custom amount
		await element(by.id('N1').withAncestor(by.id('SpendingAdvanced'))).tap();
		await element(by.id('N5').withAncestor(by.id('SpendingAdvanced'))).tap();
		await element(by.id('N0').withAncestor(by.id('SpendingAdvanced'))).multiTap(
			4,
		);
		await element(by.id('SpendingAdvancedContinue')).tap();
		await expect(
			element(by.text('100 000').withAncestor(by.id('SpendingConfirmChannel'))),
		).toBeVisible();
		await expect(
			element(by.text('150 000').withAncestor(by.id('SpendingConfirmChannel'))),
		).toBeVisible();

		// Swipe to confirm (set x offset to avoid navigating back)
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
		await waitFor(element(by.id('LightningSettingUp')))
			.toBeVisible()
			.withTimeout(10000);

		// check channel status
		await element(by.id('NavigationClose')).tap();
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).atIndex(0).tap();
		await element(by.id('Channels')).tap();
		await element(by.id('Channel')).atIndex(0).tap();
		await expect(element(by.text('Processing payment'))).toBeVisible();
		await expect(
			element(by.id('MoneyText').withAncestor(by.id('TotalSize'))),
		).toHaveText('250 000');
		await element(by.id('NavigationClose')).tap();

		const seed = await getSeed();
		await restoreWallet(seed);

		// check transfer card
		await expect(element(by.id('Suggestion-lightningSettingUp'))).toBeVisible();

		// check activity after restore
		await element(by.id('WalletsScrollView')).scrollTo('bottom', NaN, 0.85);
		await element(by.id('ActivityShort-1')).tap();
		await expect(element(by.id('StatusTransfer'))).toBeVisible();

		markComplete('transfer-1');
	});

	it('Can open a channel to external node', async () => {
		if (checkComplete('transfer-2')) {
			return;
		}

		// receive BTC
		await element(by.id('Receive')).tap();
		// get address from qrcode
		await waitFor(element(by.id('QRCode'))).toBeVisible();
		await sleep(100); // wait for qr code to render
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');

		await rpc.sendToAddress(wAddress, '0.001');
		await rpc.generateToAddress(1, await rpc.getNewAddress());

		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(20000);
		await element(by.id('NewTxPrompt')).swipe('down');

		// Get LDK node id
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
		await element(by.id('NavigationClose')).tap();

		// Get LND node id
		const lnd = await createLnRpc(lndConfig);
		const { identityPubkey: lndNodeId } = await lnd.getInfo();

		// Connect to LND
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).tap();
		await element(by.id('Channels')).tap();
		await element(by.id('NavigationAction')).tap();
		await element(by.id('FundCustom')).tap();
		await element(by.id('FundManual')).tap();
		await element(by.id('NodeIdInput')).replaceText(lndNodeId);
		await element(by.id('HostInput')).replaceText('0.0.0.0');
		await element(by.id('PortInput')).replaceText('9735');
		await element(by.id('PortInput')).tapReturnKey();
		await element(by.id('ExternalContinue')).tap();

		// wait for peer to be connected
		await waitForPeerConnection(lnd, ldkNodeId);

		// Set amount
		await element(by.id('N2').withAncestor(by.id('ExternalAmount'))).tap();
		await element(by.id('N0').withAncestor(by.id('ExternalAmount'))).multiTap(
			4,
		);
		await element(by.id('ExternalAmountContinue')).tap();

		// change fee
		await element(by.id('SetCustomFee')).tap();
		await element(
			by.id('NRemove').withAncestor(by.id('FeeCustomNumberPad')),
		).tap();
		await element(by.id('FeeCustomContinue')).tap();
		await element(by.id('N5').withAncestor(by.id('FeeCustomNumberPad'))).tap();
		await element(by.id('FeeCustomContinue')).tap();

		// Swipe to confirm (set x offset to avoid navigating back)
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
		await waitFor(element(by.id('ExternalSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('ExternalSuccess-button')).tap();

		// check transfer card
		await expect(element(by.id('Suggestion-lightningSettingUp'))).toBeVisible();

		// check activity
		await element(by.id('WalletsScrollView')).scrollTo('bottom', NaN, 0.85);
		await expect(element(by.text('From Savings (±30m)'))).toBeVisible();
		await element(by.id('ActivityShort-1')).tap();
		await expect(element(by.text('Transfer (±30m)'))).toBeVisible();
		await element(by.id('NavigationClose')).tap();
		await element(by.id('WalletsScrollView')).scrollTo('top', NaN, 0.85);

		// Mine 3 blocks
		await rpc.generateToAddress(3, await rpc.getNewAddress());

		// TODO: mine single blocks and check updated transfer time

		// Sometimes the channel is only opened after restart
		await launchAndWait();

		// wait for channel to be opened
		await waitForActiveChannel(lnd, ldkNodeId);

		await expect(
			element(by.id('Suggestion-lightningSettingUp')),
		).not.toBeVisible();

		// check channel status
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).atIndex(0).tap();
		await element(by.id('Channels')).tap();
		await element(by.id('Channel')).atIndex(0).tap();
		await expect(
			element(by.id('MoneyText').withAncestor(by.id('TotalSize'))),
		).toHaveText('20 000');
		await element(by.id('ChannelScrollView')).scrollTo('bottom', NaN, 0.1);
		await expect(element(by.id('IsUsableYes'))).toBeVisible();
		await element(by.id('NavigationClose')).atIndex(0).tap();

		// get invoice
		const { paymentRequest } = await lnd.addInvoice({ memo: 'zero' });

		// send payment
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(paymentRequest);
		await element(by.id('RecipientInput')).tapReturnKey();
		// wait for keyboard to hide
		await sleep(1000);
		await element(by.id('AddressContinue')).tap();
		await element(
			by.id('N1').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(3);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();
		await waitFor(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		)
			.toHaveText('99 059')
			.withTimeout(10000);

		// close the channel
		await element(by.id('ActivitySpending')).tap();
		await element(by.id('TransferToSavings')).tap();
		await element(by.id('SavingsIntro-button')).tap();
		await element(by.id('AvailabilityContinue')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
		await waitFor(element(by.id('TransferSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('TransferSuccess-button')).tap();

		// check channel is closed
		await element(by.id('Settings')).tap();
		await element(by.id('AdvancedSettings')).atIndex(0).tap();
		await element(by.id('Channels')).tap();
		await expect(element(by.text('Connection 1'))).not.toBeVisible();
		await element(by.id('ChannelsClosed')).tap();
		await expect(element(by.text('Connection 1'))).toBeVisible();

		markComplete('transfer-2');
	});
});
