import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import { UnitBitcoinIcon, UnitSatoshiIcon } from '../../../styles/components';
import type { SettingsScreenProps } from '../../../navigation/types';

const bitcoinUnits = [
	{
		label: 'Bitcoin',
		unit: 'BTC',
		labelExample: '(0.0000100)',
		Icon: UnitBitcoinIcon,
	},
	{
		label: 'Satoshis',
		unit: 'satoshi',
		labelExample: '(1 000)',
		Icon: UnitSatoshiIcon,
	},
];

const BitcoinUnitSettings = ({
	navigation,
}: SettingsScreenProps<'BitcoinUnitSettings'>): ReactElement => {
	const selectedBitcoinUnit = useSelector(
		(state: Store) => state.settings.bitcoinUnit,
	);

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Display Bitcoin amounts as',
				data: bitcoinUnits.map((bitcoinUnit) => ({
					title: `${bitcoinUnit.label} ${bitcoinUnit.labelExample}`,
					value: bitcoinUnit.unit === selectedBitcoinUnit,
					type: 'button',
					Icon: bitcoinUnit.Icon,
					onPress: (): void => {
						navigation.goBack();
						updateSettings({ bitcoinUnit: bitcoinUnit.unit });
					},
				})),
			},
		],
		[selectedBitcoinUnit, navigation],
	);

	return (
		<SettingsView
			title="Bitcoin Unit"
			listData={currencyListData}
			showBackNavigation
		/>
	);
};

export default memo(BitcoinUnitSettings);
