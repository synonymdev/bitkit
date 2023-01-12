import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

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

const transactionSpeeds = [
	{
		label: 'Fast (more expensive)',
		value: ETransactionSpeed.fast,
		description: '± 10-20 minutes',
		Icon: SpeedFastIcon,
		iconColor: 'brand',
	},
	{
		label: 'Normal',
		value: ETransactionSpeed.normal,
		description: '± 20-60 minutes',
		Icon: SpeedNormalIcon,
		iconColor: 'brand',
	},
	{
		label: 'Slow (cheaper)',
		value: ETransactionSpeed.slow,
		description: '± 1-2 hours',
		Icon: SpeedSlowIcon,
		iconColor: 'brand',
	},
	{
		label: 'Custom',
		value: ETransactionSpeed.custom,
		description: 'Depends on fee',
		Icon: SettingsIcon,
		iconColor: 'gray1',
	},
];

const TransactionSpeedSettings = ({
	navigation,
}: SettingsScreenProps<'TransactionSpeedSettings'>): ReactElement => {
	const selectedTransactionSpeed = useSelector(transactionSpeedSelector);

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Default Transaction Speed',
				data: transactionSpeeds.map((txSpeed) => ({
					title: txSpeed.label,
					value: txSpeed.value === selectedTransactionSpeed,
					type: EItemType.button,
					Icon: txSpeed.Icon,
					iconColor: txSpeed.iconColor,
					description: txSpeed.description,
					onPress: (): void => {
						navigation.goBack();
						updateSettings({ transactionSpeed: txSpeed.value });
					},
				})),
			},
		],
		[selectedTransactionSpeed, navigation],
	);

	return (
		<SettingsView
			title="Transaction Speed"
			listData={currencyListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(TransactionSpeedSettings);
