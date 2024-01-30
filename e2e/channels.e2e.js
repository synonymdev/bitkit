import BitcoinJsonRpc from 'bitcoin-json-rpc';
import jestExpect from 'expect';

import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';
import {
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	isButtonEnabled,
	bitcoinURL,
	electrumHost,
	electrumPort,
	sleep,
} from './helpers';

const d = checkComplete('channels-1') ? describe.skip : describe;

d('LN Channel Onboarding', () => {
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

	d('Lightning onboarding / Channel purchase', () => {
		// Test plan
		// QuickSetup
		// - can change amount via the slider
		// - can change amount via the NumberPad
		// - cannot continue with zero spending balance
		// - shows the blocktank limit (9999$ on staging) and note
		// - shows the reserve limit (80%) and note

		// CustomSetup
		// - can change amount via the cards
		// - can change amount via the NumberPad
		// - can change channel duration
		// - shows disabled receiving cards when spending amount is higher

		it('Can buy a channel via the QuickSetup and CustomSetup', async () => {
			if (checkComplete('channels-1')) {
				return;
			}

			// receive BTC
			await element(by.id('Receive')).tap();
			await element(by.id('UnderstoodButton')).tap();
			// get address from qrcode
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');

			await rpc.sendToAddress(wAddress, '0.1');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await waitForElectrum();

			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen

			await element(by.id('Suggestion-lightning')).tap();
			await element(by.id('QuickSetupButton')).tap();
			// set spending balance to zero
			await element(by.id('SliderHandle')).swipe('left');
			const button = element(by.id('QuickSetupContinue'));
			const buttonEnabled = await isButtonEnabled(button);
			jestExpect(buttonEnabled).toBe(false);

			// should show 80% limit note
			await element(by.id('SliderHandle')).swipe('right', 'slow', NaN, 0.8);
			await expect(element(by.id('QuickSetupBlocktankNote'))).toBeVisible();
			await element(by.id('QuickSetupCustomAmount')).tap();
			await element(by.id('NumberPadButtonsMax')).tap();
			await element(by.id('NumberPadButtonsDone')).tap();
			await expect(element(by.id('QuickSetupBlocktankNote'))).toBeVisible();
			// await expect(element(by.text('80%'))).toBeVisible();

			// get more BTC
			await rpc.sendToAddress(wAddress, '0.5');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await waitForElectrum();
			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen

			// should show Blocktank limit note
			await element(by.id('SliderHandle')).swipe('right', 'slow', NaN, 0.8);
			await expect(element(by.id('QuickSetupBlocktankNote'))).toBeVisible();
			await element(by.id('QuickSetupCustomAmount')).tap();
			await element(by.id('NumberPadButtonsMax')).tap();
			await element(by.id('NumberPadButtonsDone')).tap();
			await expect(element(by.id('QuickSetupBlocktankNote'))).toBeVisible();

			// NumberPad
			await element(by.id('SliderHandle')).swipe('left');
			await element(by.id('QuickSetupCustomAmount')).tap();
			await element(by.id('N2').withAncestor(by.id('QuickSetup'))).tap();
			await element(by.id('N0').withAncestor(by.id('QuickSetup'))).multiTap(5);
			await element(by.id('NumberPadButtonsDone')).tap();
			await sleep(500);
			await element(by.id('QuickSetupContinue')).tap();

			await expect(element(by.text('200 000'))).toBeVisible();

			// Swipe to confirm (set x offset to avoid navigating back)
			await element(by.id('GRAB')).swipe('right', 'slow', NaN, 0.8);
			await waitFor(element(by.id('LightningSettingUp')))
				.toBeVisible()
				.withTimeout(10000);

			await rpc.generateToAddress(1, await rpc.getNewAddress());

			// CustomSetup
			await launchAndWait();
			await waitFor(element(by.id('Suggestion-lightningSettingUp')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('BitcoinAsset')).tap();
			await element(by.id('TransferButton')).tap();
			await element(by.id('CustomSetupButton')).tap();

			// NumberPad
			await element(by.id('CustomSetupCustomAmount')).tap();
			await element(by.id('NumberPadButtonsMax')).tap();
			await element(by.id('NumberPadButtonsUnit')).tap();
			await element(by.id('NumberPadButtonsDone')).tap();

			// tap the 3rd card
			await element(by.id('Barrel-big')).tap();

			// Receive Amount
			await element(by.id('CustomSetupContinue')).tap();
			const button2 = element(by.id('Barrel-medium'));
			const buttonEnabled2 = await isButtonEnabled(button2);
			jestExpect(buttonEnabled2).toBe(false);

			// go back and change to 2nd card
			await element(by.id('NavigationBack')).tap();
			await element(by.id('Barrel-medium')).tap();
			await element(by.id('CustomSetupContinue')).tap();
			await element(by.id('Barrel-medium')).tap();

			// go to confirmation screen
			await element(by.id('CustomSetupContinue')).tap();

			// check that the amounts are correct
			await expect(element(by.text('100.00'))).toBeVisible();
			await expect(element(by.text('500.00'))).toBeVisible();

			// TODO: testID on Text not working yet
			// // set channel duration
			// await element(by.id('CustomConfirmWeeks')).tap();
			// // check validation & fallback
			// await element(by.id('N9').withAncestor(by.id('CustomConfirm'))).tap();
			// await element(by.id('NRemove')).multiTap(3);
			// await element(by.id('NumberPadButtonsDone')).tap();
			// await expect(element(by.text('1 week'))).toBeVisible();

			// Swipe to confirm (set x offset to avoid navigating back)
			await element(by.id('GRAB')).swipe('right', 'slow', NaN, 0.8);
			await waitFor(element(by.id('LightningSettingUp')))
				.toBeVisible()
				.withTimeout(10000);

			markComplete('channels-1');
		});
	});
});
