import BitcoinJsonRpc from 'bitcoin-json-rpc';
import jestExpect from 'expect';

import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';
import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	isButtonEnabled,
} from './helpers';

const bitcoinURL =
	'http://electrumx:1VmSUVGBuLNWvZl0LExRDW0tvl6196-47RfXIzS384g=@localhost:43782';

describe('LN Channel Onboarding', () => {
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

	describe('Lightning onboarding / Channel purchase', () => {
		// Test plan
		// QuickSetup
		// - can change amount via the slider
		// - can change amount via the NumberPad
		// - cannot continue with zero spending balance

		// CustomSetup
		// - can change amount via the cards
		// - can change amount via the NumberPad
		// - can change channel duration

		it('Can buy a channel via the QuickSetup', async () => {
			if (checkComplete('channels-1')) {
				return;
			}

			// receive BTC
			await element(by.id('Receive')).tap();
			await element(by.id('UnderstoodButton')).tap();
			await sleep(1000); // animation
			// get address from qrcode
			let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
			wAddress = wAddress.replace('bitcoin:', '');

			await rpc.sendToAddress(wAddress, '1');
			await rpc.generateToAddress(1, await rpc.getNewAddress());
			await waitForElectrum();

			await waitFor(element(by.id('NewTxPrompt')))
				.toBeVisible()
				.withTimeout(10000);
			await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen
			await sleep(1000); // animation

			// balance should be 1 BTC
			await expect(
				element(by.id('MoneyPrimary').withAncestor(by.id('TotalBalance'))),
			).toHaveText('100 000 000');

			await element(by.id('Suggestion-lightning')).tap();
			await element(by.id('QuickSetup')).tap();
			// set spending balance to zero
			await element(by.id('SliderHandle')).swipe('left');
			await sleep(2000); // wait for weird slider behavior
			const button = element(by.id('QuickSetupContinue'));
			const buttonEnabled = await isButtonEnabled(button);
			jestExpect(buttonEnabled).toBe(false);

			// NumberPad
			await element(by.id('QuickSetupNumberField')).tap();
			await element(by.id('NumberPadButtonsMax')).tap();
			await element(by.id('NumberPadButtonsUnit')).tap();
			await element(by.id('NumberPadButtonsDone')).tap();
			await element(by.id('QuickSetupContinue')).tap();

			// check that the max amount is correct
			await expect(element(by.text('999.00'))).toBeVisible();

			// Swipe to confirm (set x offset to avoid navigating back)
			await element(by.id('GRAB')).swipe('right', 'slow', NaN, 0.8);
			await sleep(1000); // animation
			await element(by.id('LightningResultConfirm')).tap();
			await expect(
				element(by.id('Suggestion-lightningSettingUp')),
			).toBeVisible();

			markComplete('channels-1');
		});

		it('Can buy a channel via the CustomSetup', async () => {
			if (checkComplete('channels-2')) {
				return;
			}

			await element(by.id('Suggestion-lightningSettingUp')).tap();
			await element(by.id('NavigationAction')).tap();

			// NumberPad
			await element(by.id('CustomSetupCustomAmount')).tap();
			await element(by.id('NumberPadButtonsMax')).tap();
			await element(by.id('NumberPadButtonsUnit')).tap();
			await element(by.id('NumberPadButtonsDone')).tap();

			// tap the 2nd card
			await element(by.id('Barrel-medium')).tap();

			// go to confirmation screen
			await element(by.id('CustomSetupContinue')).tap();
			await sleep(1000); // animation
			await element(by.id('CustomSetupContinue')).tap();
			await sleep(1000); // animation

			// check that the amounts are correct
			await expect(element(by.text('500.00'))).toBeVisible();
			await expect(element(by.text('999.00'))).toBeVisible();

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
			await sleep(1000); // animation
			await element(by.id('LightningResultConfirm')).tap();
			await element(by.id('NavigationBack')).tap();
			await expect(
				element(by.id('Suggestion-lightningSettingUp')),
			).toBeVisible();

			markComplete('channels-2');
		});
	});
});
