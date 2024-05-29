import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
	electrumHost,
	electrumPort,
} from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

const d = checkComplete(['security-1']) ? describe.skip : describe;

const waitForPinScreen = async () => {
	for (let i = 0; i < 60; i++) {
		try {
			await sleep(1000);
			await element(by.id('NRemove').withAncestor(by.id('PinPad'))).tap();
			break;
		} catch (e) {
			continue;
		}
	}
};

d('Settings Security And Privacy', () => {
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

		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
	});

	afterEach(() => {
		waitForElectrum?.close();
	});

	it('Can setup PIN and Biometrics', async () => {
		// test plan:
		// - set up PIN with Biometrics
		// - try login with Biometrics and with PIN
		// - enable PIN without Biometrics
		// - change PIN
		// - login with PIN
		// - disable PIN
		// - enter wrong PIN 10 times and reset the app
		if (checkComplete('security-1')) {
			return;
		}

		await device.setBiometricEnrollment(true);

		await element(by.id('Settings')).tap();
		await element(by.id('SecuritySettings')).tap();
		await element(by.id('PINCode')).tap();
		await element(by.id('SecureWallet-button-continue')).tap();
		await element(by.id('N1')).multiTap(4); // enter PIN
		await element(by.id('N2')).multiTap(4); // retype wrong PIN
		await expect(element(by.id('WrongPIN'))).toBeVisible(); // WrongPIN warning should appear
		await element(by.id('N1')).multiTap(4); // enter PIN
		await element(by.id('ToggleBiometrics')).tap();
		await element(by.id('ContinueButton')).tap();
		await sleep(1000);
		await device.matchFace();
		await sleep(1000);

		await element(by.id('ToggleBioForPayments')).tap();
		await element(by.id('OK')).tap();
		await sleep(1000);
		// restart the app and login with Faceid
		await device.launchApp({
			newInstance: true,
			launchArgs: { detoxEnableSynchronization: 0 }, // disable detox synchronization, otherwise it will hang on faceid
		});
		await waitFor(element(by.id('Biometrics')))
			.toBeVisible()
			.withTimeout(10000);
		await sleep(100);
		await device.matchFace();
		await sleep(100);
		await device.enableSynchronization();
		await sleep(1000);
		// app unlocked now
		await expect(element(by.id('TotalBalance'))).toBeVisible();
		await sleep(1000);

		// TODO: restart the app and login with PIN
		// currently not possibe because of Retry faceid system dialog
		// await device.launchApp({
		// 	newInstance: true,
		// 	launchArgs: { detoxEnableSynchronization: 0 }, // disable detox synchronization, otherwise it will hang on faceid
		// });
		// await sleep(1000);
		// await waitFor(element(by.id('Biometrics')))
		// 	.toBeVisible()
		// 	.withTimeout(10000);
		// await device.unmatchFace();
		// await device.enableSynchronization();
		// await sleep(1000);
		// await element(by.label('Cancel')).atIndex(0).tap();

		// receive
		await element(by.id('Receive')).tap();
		await sleep(100);
		// get address from qrcode
		await waitFor(element(by.id('QRCode'))).toBeVisible();
		await sleep(100); // wait for qr code to render
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');
		await rpc.sendToAddress(wAddress, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down'); // close Receive screen

		// send, using FaceID
		const coreAddress = await rpc.getNewAddress();
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(coreAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(1000); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N000').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(2);
		await element(by.id('ContinueAmount')).tap();
		await sleep(100);
		await device.disableSynchronization();
		await sleep(100);
		await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
		await sleep(100);
		await device.matchFace();
		await sleep(100);
		await device.enableSynchronization();
		await sleep(1000);
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// test PIN on idle and disable it after
		await element(by.id('Settings')).tap();
		await element(by.id('SecuritySettings')).tap();

		// FIXME: this fails too often
		// await element(by.id('EnablePinOnIdle')).tap();
		// await device.matchFace();
		// await waitFor(element(by.id('Biometrics')))
		// 	.toBeVisible()
		// 	.withTimeout(100000);
		// await device.matchFace();
		// await sleep(1000);
		// await element(by.id('EnablePinOnIdle')).tap();
		// await device.matchFace();
		// await sleep(1000);

		// disable FaceID, change PIN, restart the app and try it
		await element(by.id('UseBiometryInstead')).tap();
		await device.matchFace();
		await sleep(1000);
		await element(by.id('ChangePIN')).tap();
		await element(by.id('N1').withAncestor(by.id('PinPad'))).multiTap(4);
		await sleep(1000);
		await element(by.id('N1').withAncestor(by.id('ChangePIN'))).multiTap(4);
		await sleep(1000);
		await element(by.id('N2').withAncestor(by.id('ChangePIN2'))).multiTap(4);
		await element(by.id('N9').withAncestor(by.id('ChangePIN2'))).multiTap(4);
		await expect(element(by.id('WrongPIN'))).toBeVisible();
		await element(by.id('N2').withAncestor(by.id('ChangePIN2'))).multiTap(4);
		await element(by.id('OK')).tap();

		await device.launchApp({ newInstance: true });
		await waitFor(
			element(by.id('N2').withAncestor(by.id('PinPad'))),
		).toBeVisible();
		await waitForPinScreen();
		await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
		await waitFor(element(by.id('TotalBalance')))
			.toBeVisible()
			.withTimeout(10000);

		// send, using PIN
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(coreAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(1000); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N000').withAncestor(by.id('SendAmountNumberPad')),
		).multiTap(2);
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
		await element(by.id('N2')).multiTap(4);
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// disable PIN, restart the app, it should not ask for it
		await element(by.id('Settings')).tap();
		await element(by.id('SecuritySettings')).tap();
		await element(by.id('PINCode')).tap();
		await element(by.id('DisablePin')).tap();
		await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
		await sleep(1000);
		await device.launchApp({ newInstance: true });
		await waitFor(element(by.id('TotalBalance')))
			.toBeVisible()
			.withTimeout(10000);

		// enable PIN for last test
		await element(by.id('Settings')).tap();
		await element(by.id('SecuritySettings')).tap();
		await element(by.id('PINCode')).tap();
		await element(by.id('SecureWallet-button-continue')).tap();
		await element(by.id('N1')).multiTap(4); // enter PIN
		await element(by.id('N1')).multiTap(4); // enter PIN
		await element(by.id('ToggleBiometrics')).tap();
		await element(by.id('ContinueButton')).tap();
		await sleep(1000);

		// now lets restart the app and fail to enter correct PIN 8 times
		await device.launchApp({ newInstance: true });
		await waitFor(
			element(by.id('N2').withAncestor(by.id('PinPad'))),
		).toBeVisible();
		await waitForPinScreen();
		await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
		await waitFor(element(by.id('AttemptsRemaining'))).toBeVisible();
		for (let i = 0; i < 6; i++) {
			await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4); // repeat 6 times
		}
		await waitFor(element(by.id('LastAttempt'))).toBeVisible();
		await element(by.id('N2').withAncestor(by.id('PinPad'))).multiTap(4);
		await sleep(1000);

		// app should show Licence agreement
		await device.launchApp({ newInstance: true });
		await waitFor(element(by.id('Check1'))).toBeVisible();

		markComplete('security-1');
	});
});
