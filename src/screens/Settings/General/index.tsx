import React, { memo, ReactElement, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData, ItemData } from '../../../components/List';
import SettingsView from './../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';
import { lastUsedTagsSelector } from '../../../store/reselect/metadata';
import {
	unitSelector,
	selectedCurrencySelector,
	showWidgetsSelector,
	transactionSpeedSelector,
} from '../../../store/reselect/settings';
import { EUnit } from '../../../store/types/wallet';
import { updateSettings } from '../../../store/slices/settings';

const GeneralSettings = ({
	navigation,
}: SettingsScreenProps<'GeneralSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const lastUsedTags = useAppSelector(lastUsedTagsSelector);
	const showWidgets = useAppSelector(showWidgetsSelector);
	const selectedTransactionSpeed = useAppSelector(transactionSpeedSelector);
	const selectedCurrency = useAppSelector(selectedCurrencySelector);
	const selectedUnit = useAppSelector(unitSelector);

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
					selectedUnit === EUnit.BTC
						? t('general.unit_bitcoin')
						: selectedCurrency,
				type: EItemType.button,
				testID: 'UnitSettings',
				onPress: (): void => navigation.navigate('UnitSettings'),
			},
			{
				title: t('general.speed'),
				value: transactionSpeeds[selectedTransactionSpeed],
				type: EItemType.button,
				testID: 'TransactionSpeedSettings',
				onPress: (): void => navigation.navigate('TransactionSpeedSettings'),
			},
			{
				title: t('general.widgets'),
				type: EItemType.switch,
				enabled: showWidgets,
				testID: 'WidgetsSettings',
				onPress: (): void => {
					dispatch(updateSettings({ showWidgets: !showWidgets }));
				},
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
		showWidgets,
		selectedCurrency,
		selectedUnit,
		selectedTransactionSpeed,
		navigation,
		dispatch,
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
