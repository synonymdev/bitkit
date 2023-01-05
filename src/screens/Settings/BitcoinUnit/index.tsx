import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { UnitBitcoinIcon, UnitSatoshiIcon } from '../../../styles/icons';
import { bitcoinUnitSelector } from '../../../store/reselect/settings';
import { EBitcoinUnit } from '../../../store/types/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';

const bitcoinUnits = [
	{
		label: 'Bitcoin',
		unit: EBitcoinUnit.BTC,
		labelExample: '(0.0000100)',
		Icon: UnitBitcoinIcon,
	},
	{
		label: 'Satoshis',
		unit: EBitcoinUnit.satoshi,
		labelExample: '(1 000)',
		Icon: UnitSatoshiIcon,
	},
];

const BitcoinUnitSettings = ({
	navigation,
}: SettingsScreenProps<'BitcoinUnitSettings'>): ReactElement => {
	const selectedBitcoinUnit = useSelector(bitcoinUnitSelector);

	const currencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Display Bitcoin amounts as',
				data: bitcoinUnits.map((bitcoinUnit) => ({
					title: `${bitcoinUnit.label} ${bitcoinUnit.labelExample}`,
					value: bitcoinUnit.unit === selectedBitcoinUnit,
					type: EItemType.button,
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
			showBackNavigation={true}
		/>
	);
};

export default memo(BitcoinUnitSettings);
