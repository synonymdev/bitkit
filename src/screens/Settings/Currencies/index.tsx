import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { mostUsedExchangeTickers } from '../../../utils/exchange-rate/types';
import { updateSettings } from '../../../store/actions/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const CurrenciesSettings = ({
	navigation,
}: SettingsScreenProps<'CurrenciesSettings'>): ReactElement => {
	const exchangeRates = useSelector(
		(state: Store) => state.wallet.exchangeRates,
	);

	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);

	const onSetCurrency = (currency: string): void => {
		updateSettings({ selectedCurrency: currency });
	};

	const CurrencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Most Used',
				data: Object.values(mostUsedExchangeTickers).map((ticker) => {
					return {
						title: `${ticker.quote} (${ticker.currencySymbol})`,
						value: selectedCurrency === ticker.quote,
						type: 'button',
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
						type: 'button',
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
			listData={CurrencyListData}
			showBackNavigation
			showSearch
			footerText="Prices powered by Bitfinex & CoinGecko."
		/>
	);
};

export default memo(CurrenciesSettings);
