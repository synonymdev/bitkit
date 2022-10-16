import React, { memo, ReactElement, useMemo } from 'react';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';

const AdvancedSettings = ({ navigation }): ReactElement => {
	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Coin selection',
						type: 'button',
						onPress: (): void => navigation.navigate('CoinSelectPreference'),
						hide: false,
					},
					{
						title: 'Payment preference',
						type: 'button',
						onPress: (): void => navigation.navigate('PaymentPreference'),
						hide: false,
					},
				],
			},
		],
		[navigation],
	);

	return (
		<SettingsView
			title={'Advanced'}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AdvancedSettings);
