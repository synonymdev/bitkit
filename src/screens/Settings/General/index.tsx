import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';
import {
	bitcoinUnitSelector,
	selectedCurrencySelector,
	showSuggestionsSelector,
	transactionSpeedSelector,
} from '../../../store/reselect/settings';

const GeneralSettings = ({
	navigation,
}: SettingsScreenProps<'GeneralSettings'>): ReactElement => {
	const { t } = useTranslation('settings');

	const showSuggestions = useSelector(showSuggestionsSelector);
	const selectedTransactionSpeed = useSelector(transactionSpeedSelector);
	const selectedCurrency = useSelector(selectedCurrencySelector);
	const selectedBitcoinUnit = useSelector(bitcoinUnitSelector);

	const settingsListData: IListData[] = useMemo(() => {
		const transactionSpeeds = {
			slow: t('fee.slow.value'),
			normal: t('fee.normal.value'),
			fast: t('fee.fast.value'),
			custom: t('fee.custom.value'),
		};

		return [
			{
				data: [
					{
						title: t('general.currency_local'),
						value: selectedCurrency,
						type: EItemType.button,
						onPress: (): void => navigation.navigate('CurrenciesSettings'),
						testID: 'CurrenciesSettings',
					},
					{
						title: t('general.unit'),
						value:
							selectedBitcoinUnit === 'BTC'
								? t('general.unit_bitcoin')
								: t('general.unit_sathoshis'),
						type: EItemType.button,
						onPress: (): void => navigation.navigate('BitcoinUnitSettings'),
						testID: 'BitcoinUnitSettings',
					},
					{
						title: t('general.speed'),
						value: transactionSpeeds[selectedTransactionSpeed],
						type: EItemType.button,
						onPress: (): void =>
							navigation.navigate('TransactionSpeedSettings'),
						testID: 'TransactionSpeedSettings',
					},
					{
						title: t('general.suggestions'),
						value: t(
							showSuggestions
								? 'general.suggestions_visible'
								: 'general.suggestions_hidden',
						),
						type: EItemType.button,
						onPress: (): void => navigation.navigate('SuggestionsSettings'),
						testID: 'SuggestionsSettings',
					},
				],
			},
		];
	}, [
		selectedCurrency,
		selectedBitcoinUnit,
		selectedTransactionSpeed,
		showSuggestions,
		navigation,
		t,
	]);

	return (
		<SettingsView
			title={t('general_title')}
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(GeneralSettings);
