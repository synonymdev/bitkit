import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
	SettingsIcon,
} from '../../../styles/icons';
import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { transactionSpeedSelector } from '../../../store/reselect/settings';
import { ETransactionSpeed } from '../../../store/types/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

const TransactionSpeedSettings = ({
	navigation,
}: SettingsScreenProps<'TransactionSpeedSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedTransactionSpeed = useSelector(transactionSpeedSelector);

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
				iconColor: 'gray1',
			},
		];

		return [
			{
				title: t('general.speed_default'),
				data: transactionSpeeds.map((txSpeed) => ({
					title: txSpeed.label,
					value: txSpeed.value === selectedTransactionSpeed,
					type: EItemType.button,
					Icon: txSpeed.Icon,
					iconColor: txSpeed.iconColor,
					description: txSpeed.description,
					testID: txSpeed.value,
					onPress: (): void => {
						if (txSpeed.value === ETransactionSpeed.custom) {
							navigation.navigate('CustomFee');
						} else {
							navigation.goBack();
							updateSettings({ transactionSpeed: txSpeed.value });
						}
					},
				})),
			},
		];
	}, [selectedTransactionSpeed, navigation, t]);

	return (
		<SettingsView
			title={t('general.speed_title')}
			listData={currencyListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(TransactionSpeedSettings);
