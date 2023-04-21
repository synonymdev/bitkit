import {
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

	// test plan:
	// - correct spacing for sats (100000000 -> 100 000 000)
	// - no trailing (decimal) zeros after switching units (0.100 -> 0.1, 12.00 -> 12)
	// - no rounding when switching units
	// - no leading (integer) zeros (01.23 -> 1.23)
	// - no multiple zeros (000.23 -> 0.23)
	// - no multiple decimal symbols (0...23 -> 0.23)
	// - correct placeholders

	// Receive
	// - no exceeding maxAmount
	// - numberPadTextField value still there after navigating back and forth

	// Send
	// TODO:

	// Lightning
	// TODO:

	// NumberPadWeeks
	// TODO:

	it('Can enter amounts and switch units', async () => {
		if (checkComplete('numberpad-1')) {
			return;
		}

		await element(by.id('Receive')).tap();
		await element(by.id('UnderstoodButton')).tap();
		await element(by.id('SpecifyInvoiceButton')).tap();
		await element(by.id('ReceiveNumberPadTextField')).tap();

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
		await element(by.id('ReceiveNumberPadUnit')).multiTap(2);
		await expect(element(by.text('0.000123'))).toBeVisible();
		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(7);
		await element(by.id('N4').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N0').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N6').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N9').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('4.2069'))).toBeVisible();

		markComplete('numberpad-1');
	});

	it('Cannot enter more than one zero or decimal symbol', async () => {
		if (checkComplete('numberpad-2')) {
			return;
		}

		await element(by.id('Receive')).tap();
		await element(by.id('SpecifyInvoiceButton')).tap();
		await element(by.id('ReceiveNumberPadTextField')).tap();
		await element(by.id('N0').withAncestor(by.id('ReceiveNumberPad'))).multiTap(
			2,
		);
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(2);
		await element(by.id('N0').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await expect(element(by.text('1.01'))).toBeVisible();

		markComplete('numberpad-2');
	});
});
