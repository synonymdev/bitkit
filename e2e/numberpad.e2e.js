import {
	sleep,
	checkComplete,
	markComplete,
	completeOnboarding,
	launchAndWait,
} from './helpers';

describe('NumberPad', () => {
	beforeAll(async () => {
		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
	});

	it('Can enter amounts and switch units', async () => {
		if (checkComplete('numberpad-1')) {
			return;
		}

		await element(by.id('Receive')).tap();
		await element(by.id('UnderstoodButton')).tap();
		await sleep(1000); // animation
		await element(by.id('SpecifyInvoiceButton')).tap();
		await element(by.id('ReceiveAmountToggle')).tap();

		// Unit set to sats
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N3').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('123'))).toBeVisible();

		await element(by.id('N000').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('123 000'))).toBeVisible();

		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await expect(element(by.text('12 300'))).toBeVisible();

		// Switch to BTC
		await element(by.id('ReceiveNumberPadSwitch')).multiTap(2);
		await expect(element(by.text('0.00012300'))).toBeVisible();
		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(3);
		await element(by.id('N4').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N0').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N6').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N9').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('4.20690000'))).toBeVisible();

		markComplete('numberpad-1');
	});
});
