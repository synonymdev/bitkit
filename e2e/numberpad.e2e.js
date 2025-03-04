import {
	checkComplete,
	markComplete,
	completeOnboarding,
	launchAndWait,
} from './helpers';

const d = checkComplete(['numberpad-modern', 'numberpad-classic'])
	? describe.skip
	: describe;

d('NumberPad', () => {
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
	// - classic denomination

	// Receive
	// - no exceeding maxAmount
	// - numberPadTextField value still there after navigating back and forth

	it('Can enter amounts in modern denomination', async () => {
		if (checkComplete('numberpad-modern')) {
			return;
		}

		await element(by.id('Receive')).tap();
		await element(by.id('SpecifyInvoiceButton')).tap();
		await element(by.id('ReceiveNumberPadTextField')).tap();

		// Unit set to sats
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N3').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('123'))).toBeVisible();

		await element(by.id('N000').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('123 000'))).toBeVisible();

		// Switch to USD
		await element(by.id('ReceiveNumberPadUnit')).tap();
		// reset to 0
		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(8);
		await expect(
			element(by.text('0.00').withAncestor(by.id('ReceiveNumberPadTextField'))),
		).toBeVisible();
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

		// Switch back to BTC
		await element(by.id('ReceiveNumberPadUnit')).tap();

		markComplete('numberpad-modern');
	});

	it('Can enter amounts in classic denomination', async () => {
		if (checkComplete('numberpad-classic')) {
			return;
		}

		// switch to classic denomination
		await element(by.id('HeaderMenu')).tap();
		await element(by.id('DrawerSettings')).tap();
		await element(by.id('GeneralSettings')).tap();
		await element(by.id('UnitSettings')).tap();
		await element(by.id('DenominationClassic')).tap();
		await element(by.id('NavigationClose')).atIndex(0).tap();

		await element(by.id('Receive')).tap();
		await element(by.id('SpecifyInvoiceButton')).tap();
		await element(by.id('ReceiveNumberPadTextField')).tap();

		// Unit set to BTC
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('1.00000000'))).toBeVisible();

		// can only enter one decimal symbol
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(2);
		await expect(element(by.text('1.00000000'))).toBeVisible();

		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await expect(element(by.text('1.00000000'))).toBeVisible();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).tap();

		// reset to 0
		await element(
			by.id('NRemove').withAncestor(by.id('ReceiveNumberPad')),
		).multiTap(8);
		await element(by.id('N4').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(
			by.id('NDecimal').withAncestor(by.id('ReceiveNumberPad')),
		).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N0').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N6').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N9').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('4.20690000'))).toBeVisible();

		markComplete('numberpad-classic');
	});
});
