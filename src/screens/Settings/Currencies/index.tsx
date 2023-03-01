import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { mostUsedExchangeTickers } from '../../../utils/exchange-rate/types';
import { updateSettings } from '../../../store/actions/settings';
import { exchangeRatesSelector } from '../../../store/reselect/wallet';
import { selectedCurrencySelector } from '../../../store/reselect/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const CurrenciesSettings = ({
	navigation,
}: SettingsScreenProps<'CurrenciesSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const exchangeRates = useSelector(exchangeRatesSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);

	const onSetCurrency = (currency: string): void => {
		updateSettings({ selectedCurrency: currency });
	};

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: t('general.currency_most_used'),
				data: Object.values(mostUsedExchangeTickers).map((ticker) => {
					return {
						title: `${ticker.quote} (${ticker.currencySymbol})`,
						value: selectedCurrency === ticker.quote,
						type: EItemType.button,
						onPress: (): void => {
							navigation.goBack();
							onSetCurrency(ticker.quote);
						},
					};
				}),
			},
			{
				title: t('general.currency_other'),
				data: Object.keys(exchangeRates)
					.sort()
					.map((ticker) => ({
						title: ticker,
						value: selectedCurrency === ticker,
						type: EItemType.button,
						onPress: (): void => {
							navigation.goBack();
							onSetCurrency(ticker);
						},
					})),
			},
		],
		[selectedCurrency, exchangeRates, navigation, t],
	);

	return (
		<SettingsView
			title={t('general.currency_local_title')}
			listData={currencyListData}
			showBackNavigation={true}
			showSearch={true}
			footerText={t('general.currency_footer')}
		/>
	);
};

export default memo(CurrenciesSettings);
