import React, { memo, ReactElement, useMemo } from 'react';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';

const AdvancedSettings = ({
	navigation,
}: SettingsScreenProps<'AdvancedSettings'>): ReactElement => {
	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Coin selection',
						type: 'button',
						onPress: (): void => navigation.navigate('CoinSelectPreference'),
					},
					{
						title: 'Payment preference',
						type: 'button',
						onPress: (): void => navigation.navigate('PaymentPreference'),
					},
				],
			},
		],
		[navigation],
	);

	return (
		<SettingsView
			title="Advanced"
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AdvancedSettings);
