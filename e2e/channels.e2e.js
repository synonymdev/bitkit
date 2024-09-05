import BitcoinJsonRpc from 'bitcoin-json-rpc';
import jestExpect from 'expect';

import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';
import {
	bitcoinURL,
	checkComplete,
	completeOnboarding,
	electrumHost,
	electrumPort,
	isButtonEnabled,
	launchAndWait,
	markComplete,
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
		// - cannot continue with zero spending balance
		// - can change amount
		// Advanced
		// - can change amount

		it('Can buy a channel with default and custom receive capacity', async () => {
			if (checkComplete('channels-1')) {
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
			await element(by.id('SpendingIntro-button')).tap();
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
			await expect(element(by.text('110 000'))).toBeVisible();
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
			await element(
				by.id('N0').withAncestor(by.id('SpendingAdvanced')),
			).multiTap(4);
			await element(by.id('SpendingAdvancedContinue')).tap();
			await expect(
				element(
					by.text('100 000').withAncestor(by.id('SpendingConfirmChannel')),
				),
			).toBeVisible();
			await expect(
				element(
					by.text('150 000').withAncestor(by.id('SpendingConfirmChannel')),
				),
			).toBeVisible();

			// Swipe to confirm (set x offset to avoid navigating back)
			await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5);
			await waitFor(element(by.id('LightningSettingUp')))
				.toBeVisible()
				.withTimeout(10000);

			markComplete('channels-1');
		});
	});
});
