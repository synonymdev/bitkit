import {
	checkComplete,
	markComplete,
	completeOnboarding,
	launchAndWait,
} from './helpers';

describe('Receive', () => {
	beforeAll(async () => {
		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
	});

	// General
	// - a valid BIP21 URI exists
	// - can swipe to onchain/lightning
	// - invoice data still there after navigating back and forth
	// - invoice data reset after closing & opening

	// NumberPad
	// - correct spacing for sats (100000000 -> 100 000 000)
	// - no trailing (decimal) zeros after switching units (0.100 -> 0.1, 12.00 -> 12)
	// - no rounding when switching units
	// - no leading (integer) zeros (01.23 -> 1.23)
	// - no multiple zeros (000.23 -> 0.23)
	// - no multiple decimal symbols (0...23 -> 0.23)
	// - correct placeholders
	// - no exceeding maxAmount

	// Tags
	// - can add new tag
	// - can add prev saved tag
	// - can delete prev saved tag

	it('Basic functionality', async () => {
		if (checkComplete('receive-1-1')) {
			return;
		}

		await element(by.id('Receive')).tap();
		await element(by.id('UnderstoodButton')).tap();

		// await element(by.id('ReceiveCopyQR')).tap();
		// await waitFor(element(by.id('ReceiveTooltip1')))
		// 	.toExist()
		// 	.withTimeout(2000);
		// await expect(element(by.id('ReceiveTooltip1'))).toExist();

		// check that we have a valid BIP21 URI
		const { label: address } = await element(by.id('QRCode')).getAttributes();
		if (!address.startsWith('bitcoin:') || address.length < 20) {
			throw new Error(`Invalid receiving address: ${address}`);
		}

		// Onchain/Lightning details
		await element(by.id('ReceiveSlider')).swipe('left');
		await waitFor(element(by.id('ReceiveOnchainInvoice')))
			.toBeVisible()
			.withTimeout(2000);
		await expect(element(by.id('ReceiveOnchainInvoice'))).toBeVisible();

		// ReceiveDetail
		await element(by.id('ReceiveScreen')).swipe('right');
		await element(by.id('SpecifyInvoiceButton')).tap();

		// NumberPad
		await element(by.id('ReceiveNumberPadTextField')).tap();
		// Unit set to sats
		await element(by.id('N1').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N2').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await element(by.id('N3').withAncestor(by.id('ReceiveNumberPad'))).tap();
		await expect(element(by.text('123'))).toBeVisible();
		await element(by.id('ReceiveNumberPadSubmit')).tap();

		// TODO: move all basic NumberPad tests here

		// Invoice note
		const note = 'iPhone Refurbished';
		await element(by.id('ReceiveNote')).typeText(note);
		await element(by.id('ReceiveNote')).tapReturnKey();

		// Tags
		const tag = 'test123';
		await element(by.id('TagsAdd')).tap();
		await element(by.id('TagInputReceive')).typeText(tag);
		await element(by.id('ReceiveTagsSubmit')).tap();

		// Show QR
		await element(by.id('ShowQrReceive')).tap();

		// Back to ReceiveDetail
		// data should still be there
		await element(by.id('SpecifyInvoiceButton')).tap();
		await expect(element(by.text('123'))).toBeVisible();
		await expect(element(by.id('ReceiveNote'))).toHaveText(note);
		await expect(element(by.text(tag))).toBeVisible();

		// Close & reopen
		await element(by.id('ReceiveScreen')).swipe('down');
		await waitFor(element(by.id('Receive')))
			.toBeVisible()
			.withTimeout(2000);
		await element(by.id('Receive')).tap();

		// data should be reset
		await element(by.id('SpecifyInvoiceButton')).tap();
		await expect(element(by.text('123'))).not.toBeVisible();
		await expect(element(by.id('ReceiveNote'))).not.toHaveText(note);
		await expect(element(by.text(tag))).not.toBeVisible();

		// previous tags
		await element(by.id('TagsAdd')).tap();
		await element(by.id(`Tag-${tag}`)).tap();
		await expect(element(by.text(tag))).toBeVisible();
		await element(by.id('TagsAdd')).tap();
		await element(by.id(`Tag-${tag}-close`)).tap();
		await expect(element(by.text(tag))).not.toBeVisible();

		markComplete('receive-1-1');
	});
});
