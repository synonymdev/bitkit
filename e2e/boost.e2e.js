import { device } from 'detox';
import assert from 'node:assert';
import BitcoinJsonRpc from 'bitcoin-json-rpc';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
	getSeed,
	restoreWallet,
	waitForBackup,
} from './helpers';
import initElectrum from './electrum';

const __DEV__ = process.env.DEV === 'true';

d = checkComplete(['boost-1', 'boost-2']) ? describe.skip : describe;

d('Boost', () => {
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

	afterAll(() => {
		electrum?.stop();
	});

	beforeEach(async () => {
		await device.launchApp({ delete: true });
		await completeOnboarding();
		await launchAndWait();
	});

	it('Can do CPFP', async () => {
		if (checkComplete('boost-1')) {
			return;
		}

		// switch off RBF mode
		await element(by.id('Settings')).tap();
		if (!__DEV__) {
			await element(by.id('DevOptions')).multiTap(5); // enable dev mode
		}
		await element(by.id('DevSettings')).tap();
		await element(by.id('RBF')).tap();
		await launchAndWait();

		// fund the wallet
		await element(by.id('Receive')).tap();
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');
		await rpc.sendToAddress(wAddress, '0.001');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await electrum?.waitForSync();
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPromptButton')).tap();
		await expect(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		).toHaveText('100 000');

		// Send 10 000
		const coreAddress = await rpc.getNewAddress();
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(coreAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(500); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(by.id('N0').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N000').withAncestor(by.id('SendAmountNumberPad')),
		).tap();
		await expect(element(by.text('10 000'))).toBeVisible();
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// check Activity
		await element(by.id('HomeScrollView')).scrollTo('bottom', 0);
		await expect(element(by.id('ActivityShort-1'))).toBeVisible();
		await expect(
			element(by.text('100 000').withAncestor(by.id('ActivityShort-2'))),
		).toBeVisible();
		await expect(element(by.id('ActivityShort-3'))).not.toBeVisible();

		// confirmed receiving tx
		await element(by.id('ActivityShort-2')).tap();
		await expect(element(by.id('BoostDisabled'))).toBeVisible();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		// old tx
		await element(by.id('ActivityShort-1')).tap();
		await expect(
			element(by.text('10 000').withAncestor(by.id('ActivityAmount'))),
		).toBeVisible();
		const { label: oldFee } = await element(
			by.id('MoneyText').withAncestor(by.id('ActivityFee')),
		).getAttributes();
		await element(by.id('ActivityTxDetails')).tap();
		const { text: oldTxid } = await element(by.id('TXID')).getAttributes();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		// boost
		await element(by.id('BoostButton')).tap();
		await waitFor(element(by.id('CPFPBoost')))
			.toBeVisible()
			.withTimeout(30000);
		await element(by.id('CustomFeeButton')).tap();
		await element(by.id('Plus')).tap();
		await element(by.id('Minus')).tap();
		await element(by.id('RecomendedFeeButton')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm

		// check Activity
		await waitFor(element(by.id('BoostingIcon')))
			.toBeVisible()
			.withTimeout(30000);
		await expect(element(by.id('ActivityShort-1'))).toBeVisible();
		await expect(element(by.id('ActivityShort-2'))).toBeVisible();
		await expect(element(by.id('ActivityShort-3'))).not.toBeVisible();

		// new tx
		await element(by.id('ActivityShort-1')).tap();
		await expect(element(by.id('BoostedButton'))).toBeVisible();
		await expect(element(by.id('StatusBoosting'))).toBeVisible();
		await expect(
			element(by.text('10 000').withAncestor(by.id('ActivityAmount'))),
		).toBeVisible();
		const { label: newFee } = await element(
			by.id('MoneyText').withAncestor(by.id('ActivityFee')),
		).getAttributes();
		await element(by.id('ActivityTxDetails')).tap();
		const { text: newTxid } = await element(by.id('TXID')).getAttributes();
		assert(Number(oldFee.replace(' ', '')) < Number(newFee.replace(' ', '')));
		assert(oldTxid !== newTxid);
		await expect(element(by.id('CPFPBoosted'))).toBeVisible();

		// mine new block
		await element(by.id('NavigationBack')).atIndex(0).tap();
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitFor(element(by.id('StatusConfirmed')))
			.toBeVisible()
			.withTimeout(30000);

		markComplete('boost-1');
	});

	it('Can do RBF', async () => {
		if (checkComplete('boost-2')) {
			return;
		}

		// fund the wallet
		await element(by.id('Receive')).tap();
		let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
		wAddress = wAddress.replace('bitcoin:', '');
		await rpc.sendToAddress(wAddress, '0.001');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await electrum?.waitForSync();
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPromptButton')).tap();
		await expect(
			element(by.id('MoneyText').withAncestor(by.id('TotalBalance'))),
		).toHaveText('100 000');

		// Send 10 000
		const coreAddress = await rpc.getNewAddress();
		await element(by.id('Send')).tap();
		await element(by.id('RecipientManual')).tap();
		await element(by.id('RecipientInput')).replaceText(coreAddress);
		await element(by.id('RecipientInput')).tapReturnKey();
		await sleep(500); // wait for keyboard to hide
		await element(by.id('AddressContinue')).tap();
		await element(by.id('N1').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(by.id('N0').withAncestor(by.id('SendAmountNumberPad'))).tap();
		await element(
			by.id('N000').withAncestor(by.id('SendAmountNumberPad')),
		).tap();
		await expect(element(by.text('10 000'))).toBeVisible();
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// check Activity
		await element(by.id('HomeScrollView')).scrollTo('bottom', 0);
		await expect(element(by.id('ActivityShort-1'))).toBeVisible();
		await expect(
			element(by.text('100 000').withAncestor(by.id('ActivityShort-2'))),
		).toBeVisible();
		await expect(element(by.id('ActivityShort-3'))).not.toBeVisible();

		// confirmed receiving tx
		await element(by.id('ActivityShort-2')).tap();
		await expect(element(by.id('BoostDisabled'))).toBeVisible();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		// old tx
		await element(by.id('ActivityShort-1')).tap();
		await expect(
			element(by.text('10 000').withAncestor(by.id('ActivityAmount'))),
		).toBeVisible();
		const { label: oldFee } = await element(
			by.id('MoneyText').withAncestor(by.id('ActivityFee')),
		).getAttributes();
		await element(by.id('ActivityTxDetails')).tap();
		const { text: oldTxid } = await element(by.id('TXID')).getAttributes();
		await element(by.id('NavigationBack')).atIndex(0).tap();

		// boost
		await element(by.id('BoostButton')).tap();
		await waitFor(element(by.id('RBFBoost')))
			.toBeVisible()
			.withTimeout(30000);
		await element(by.id('CustomFeeButton')).tap();
		await element(by.id('Plus')).tap();
		await element(by.id('Minus')).tap();
		await element(by.id('RecomendedFeeButton')).tap();
		await element(by.id('GRAB')).swipe('right', 'slow', 0.95, 0.5, 0.5); // Swipe to confirm

		// check Activity
		await waitFor(element(by.id('BoostingIcon')))
			.toBeVisible()
			.withTimeout(30000);
		await expect(element(by.id('ActivityShort-1'))).toBeVisible();
		await expect(element(by.id('ActivityShort-2'))).toBeVisible();
		await expect(element(by.id('ActivityShort-3'))).not.toBeVisible();

		// new tx
		await element(by.id('ActivityShort-1')).tap();
		await expect(element(by.id('BoostedButton'))).toBeVisible();
		await expect(element(by.id('StatusBoosting'))).toBeVisible();
		await expect(
			element(by.text('10 000').withAncestor(by.id('ActivityAmount'))),
		).toBeVisible();
		const { label: newFee } = await element(
			by.id('MoneyText').withAncestor(by.id('ActivityFee')),
		).getAttributes();
		await element(by.id('ActivityTxDetails')).tap();
		const { text: newTxid } = await element(by.id('TXID')).getAttributes();
		assert(Number(oldFee.replace(' ', '')) < Number(newFee.replace(' ', '')));
		assert(oldTxid !== newTxid);
		await expect(element(by.id('RBFBoosted'))).toBeVisible();
		await element(by.id('NavigationClose')).atIndex(0).tap();

		// wipe & restore
		const seed = await getSeed();
		await waitForBackup();
		await restoreWallet(seed);

		// check activity after restore
		await element(by.id('HomeScrollView')).scrollTo('bottom', 0);
		await expect(element(by.id('BoostingIcon'))).toBeVisible();
		await element(by.id('ActivityShort-1')).tap();
		await expect(element(by.id('BoostedButton'))).toBeVisible();
		await expect(element(by.id('StatusBoosting'))).toBeVisible();

		// mine new block
		await rpc.generateToAddress(1, await rpc.getNewAddress());

		// check activity item after mine
		await waitFor(element(by.id('StatusConfirmed')))
			.toBeVisible()
			.withTimeout(30000);

		markComplete('boost-2');
	});
});
