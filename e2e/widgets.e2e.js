import {
	checkComplete,
	markComplete,
	completeOnboarding,
	launchAndWait,
} from './helpers';

d = checkComplete('widgets-1') ? describe.skip : describe;

d('Widgets', () => {
	beforeAll(async () => {
		await completeOnboarding();
	});

	beforeEach(async () => {
		await launchAndWait();
	});

	// General
	// - can add a widget
	// - can edit a widget
	// - can delete a widget

	it('Can add/edit/remove a widget', async () => {
		if (checkComplete('widgets-1')) {
			return;
		}

		// add price widget
		await element(by.id('WidgetsAdd')).tap();
		await element(by.id('WidgetsOnboarding-button')).tap();
		await element(by.id('PriceWidget')).tap();
		await waitFor(element(by.id('WidgetEdit')))
			.toBeVisible()
			.withTimeout(20000);
		await expect(element(by.text('Default'))).toBeVisible();
		await element(by.id('WidgetEdit')).tap();
		await element(by.id('WidgetEditField-BTC/EUR')).tap();
		await element(by.id('WidgetEditScrollView')).scrollTo('bottom');
		await element(by.id('PriceWidgetSetting-1W')).tap();
		await element(by.id('WidgetEditSource')).tap();
		await element(by.id('WidgetEditPreview')).tap();
		await element(by.id('WidgetSave')).tap();
		await element(by.id('WalletsScrollView')).scroll(200, 'down', NaN, 0.85);
		await expect(element(by.id('PriceWidget'))).toBeVisible();
		await expect(element(by.id('PriceWidgetRow-BTC/EUR'))).toBeVisible();
		await expect(element(by.id('PriceWidgetSource'))).toBeVisible();

		// edit price widget
		await element(by.id('WidgetsEdit')).tap();
		await element(by.id('WidgetActionEdit')).tap();
		await expect(element(by.text('Custom'))).toBeVisible();
		await element(by.id('WidgetEdit')).tap();
		await element(by.id('WidgetEditReset')).tap();
		await element(by.id('WidgetEditPreview')).tap();
		await element(by.id('WidgetSave')).tap();
		await expect(element(by.id('PriceWidget'))).toBeVisible();
		await expect(element(by.id('PriceWidgetRow-BTC/EUR'))).not.toBeVisible();
		await expect(element(by.id('PriceWidgetSource'))).not.toBeVisible();

		// delete price widget
		await element(by.id('WidgetsEdit')).tap();
		await element(by.id('WidgetActionDelete')).tap();
		await element(by.text('Yes, Delete')).tap();
		await expect(element(by.id('PriceWidget'))).not.toBeVisible();

		markComplete('widgets-1');
	});
});
