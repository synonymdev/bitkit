import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import {
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
	SettingsIcon,
} from '../../../styles/components';
import type { SettingsScreenProps } from '../../../navigation/types';

const transactionSpeeds = [
	{
		label: 'Fast',
		value: 'fast',
		description: '± 10-20 minutes',
		Icon: SpeedFastIcon,
		iconColor: 'brand',
	},
	{
		label: 'Normal',
		value: 'normal',
		description: '± 20-60 minutes',
		Icon: SpeedNormalIcon,
		iconColor: 'brand',
	},
	{
		label: 'Slow',
		value: 'slow',
		description: '± 1-2 hours',
		Icon: SpeedSlowIcon,
		iconColor: 'brand',
	},
	{
		label: 'Custom',
		value: 'custom',
		description: 'Depends on fee',
		Icon: SettingsIcon,
		iconColor: 'gray1',
	},
];

const TransactionSpeedSettings = ({
	navigation,
}: SettingsScreenProps<'TransactionSpeedSettings'>): ReactElement => {
	const selectedTransactionSpeed = useSelector(
		(state: Store) => state.settings.transactionSpeed,
	);

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Default Speed',
				data: transactionSpeeds.map((txSpeed) => ({
					title: `${txSpeed.label}`,
					value: txSpeed.value === selectedTransactionSpeed,
					type: 'button',
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
			title="Default Transaction Speed"
			listData={currencyListData}
			showBackNavigation
		/>
	);
};

export default memo(TransactionSpeedSettings);
