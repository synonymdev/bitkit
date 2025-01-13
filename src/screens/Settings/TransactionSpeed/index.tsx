import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';
import { transactionSpeedSelector } from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import { ETransactionSpeed } from '../../../store/types/settings';
import {
	SettingsIcon,
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
} from '../../../styles/icons';
import SettingsView from '../SettingsView';

const TransactionSpeedSettings = ({
	navigation,
}: SettingsScreenProps<'TransactionSpeedSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedTransactionSpeed = useAppSelector(transactionSpeedSelector);

	const currencyListData: IListData[] = useMemo(() => {
		const transactionSpeeds = [
			{
				label: t('fee.fast.label'),
				value: ETransactionSpeed.fast,
				description: t('fee.fast.description'),
				Icon: SpeedFastIcon,
				iconColor: 'brand',
			},
			{
				label: t('fee.normal.label'),
				value: ETransactionSpeed.normal,
				description: t('fee.normal.description'),
				Icon: SpeedNormalIcon,
				iconColor: 'brand',
			},
			{
				label: t('fee.slow.label'),
				value: ETransactionSpeed.slow,
				description: t('fee.slow.description'),
				Icon: SpeedSlowIcon,
				iconColor: 'brand',
			},
			{
				label: t('fee.custom.label'),
				value: ETransactionSpeed.custom,
				description: t('fee.custom.description'),
				Icon: SettingsIcon,
				iconColor: 'secondary',
			},
		];

		return [
			{
				title: t('general.speed_default'),
				data: transactionSpeeds.map((txSpeed) => ({
					title: txSpeed.label,
					subtitle: txSpeed.description,
					value: txSpeed.value === selectedTransactionSpeed,
					type: EItemType.button,
					Icon: txSpeed.Icon,
					iconColor: txSpeed.iconColor,
					testID: txSpeed.value,
					onPress: (): void => {
						if (txSpeed.value === ETransactionSpeed.custom) {
							navigation.navigate('CustomFee');
						} else {
							navigation.goBack();
							dispatch(updateSettings({ transactionSpeed: txSpeed.value }));
						}
					},
				})),
			},
		];
	}, [selectedTransactionSpeed, navigation, t, dispatch]);

	return (
		<SettingsView
			title={t('general.speed_title')}
			listData={currencyListData}
		/>
	);
};

export default memo(TransactionSpeedSettings);
