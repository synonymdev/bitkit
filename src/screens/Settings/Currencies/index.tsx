import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

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
	const exchangeRates = useSelector(exchangeRatesSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);

	const onSetCurrency = (currency: string): void => {
		updateSettings({ selectedCurrency: currency });
	};

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Most Used',
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
				title: 'Other Currencies',
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
		[selectedCurrency, exchangeRates, navigation],
	);

	return (
		<SettingsView
			title="Local Currency"
			listData={currencyListData}
			showBackNavigation={true}
			showSearch={true}
			footerText="Prices powered by Bitfinex & CoinGecko."
		/>
	);
};

export default memo(CurrenciesSettings);
