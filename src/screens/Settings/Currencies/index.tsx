import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';

import { EItemType, IListData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';
import { selectedCurrencySelector } from '../../../store/reselect/settings';
import { exchangeRatesSelector } from '../../../store/reselect/wallet';
import { updateSettings } from '../../../store/slices/settings';
import { mostUsedExchangeTickers } from '../../../utils/exchange-rate';
import SettingsView from '../SettingsView';

const CurrenciesSettings = ({
	navigation,
}: SettingsScreenProps<'CurrenciesSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const exchangeRates = useAppSelector(exchangeRatesSelector);
	const selectedCurrency = useAppSelector(selectedCurrencySelector);

	const currencyListData: IListData[] = useMemo(() => {
		const currencies = Object.keys(exchangeRates).sort();

		const onSetCurrency = (currency: string): void => {
			dispatch(updateSettings({ selectedCurrency: currency }));
		};

		return [
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
				data: currencies.map((ticker) => ({
					title: ticker,
					value: selectedCurrency === ticker,
					type: EItemType.button,
					onPress: (): void => {
						navigation.goBack();
						onSetCurrency(ticker);
					},
				})),
			},
		];
	}, [selectedCurrency, exchangeRates, navigation, t, dispatch]);

	return (
		<SettingsView
			title={t('general.currency_local_title')}
			listData={currencyListData}
			showSearch={true}
			footerText={t('general.currency_footer')}
		/>
	);
};

export default memo(CurrenciesSettings);
