import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData, ItemData } from '../../../components/List';
import SettingsView from './../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
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

	const lastUsedTags = useSelector(lastUsedTagsSelector);
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

		const data: ItemData[] = [
			{
				title: t('general.currency_local'),
				value: selectedCurrency,
				type: EItemType.button,
				testID: 'CurrenciesSettings',
				onPress: (): void => navigation.navigate('CurrenciesSettings'),
			},
			{
				title: t('general.unit'),
				value:
					selectedBitcoinUnit === 'BTC'
						? t('general.unit_bitcoin')
						: t('general.unit_satoshis'),
				type: EItemType.button,
				testID: 'BitcoinUnitSettings',
				onPress: (): void => navigation.navigate('BitcoinUnitSettings'),
			},
			{
				title: t('general.speed'),
				value: transactionSpeeds[selectedTransactionSpeed],
				type: EItemType.button,
				testID: 'TransactionSpeedSettings',
				onPress: (): void => navigation.navigate('TransactionSpeedSettings'),
			},
			{
				title: t('general.suggestions'),
				value: t(
					showSuggestions
						? 'general.suggestions_visible'
						: 'general.suggestions_hidden',
				),
				type: EItemType.button,
				testID: 'SuggestionsSettings',
				onPress: (): void => navigation.navigate('SuggestionsSettings'),
			},
		];

		if (lastUsedTags.length) {
			data.push({
				title: t('general.tags'),
				type: EItemType.button,
				testID: 'TagsSettings',
				onPress: (): void => navigation.navigate('TagsSettings'),
			});
		}
		return [{ data }];
	}, [
		lastUsedTags,
		showSuggestions,
		selectedCurrency,
		selectedBitcoinUnit,
		selectedTransactionSpeed,
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
