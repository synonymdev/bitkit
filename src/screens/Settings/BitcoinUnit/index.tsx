import React, { memo, ReactElement, useMemo } from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';

import { UnitBitcoinIcon, UnitSatoshiIcon } from '../../../styles/components';

const BitcoinUnitSettings = ({ navigation }): ReactElement => {
	const selectedBitcoinUnit = useSelector(
		(state: Store) => state.settings.bitcoinUnit,
	);

	const bitcoinUnits = [
		{
			label: 'Bitcoin',
			unit: 'BTC',
			labelExample: '(0.0001000)',
			Icon: UnitBitcoinIcon,
		},
		{
			label: 'Satoshis',
			unit: 'satoshi',
			labelExample: '(1 000)',
			Icon: UnitSatoshiIcon,
		},
	];

	const CurrencyListData: IListData[] = useMemo(
		() => [
			{
				title: 'Display Bitcoin amounts as',
				data: bitcoinUnits.map((bitcoinUnit) => ({
					title: `${bitcoinUnit.label} ${bitcoinUnit.labelExample}`,
					value: bitcoinUnit.unit === selectedBitcoinUnit,
					type: 'button',
					onPress: (): void => {
						navigation.goBack();
						updateSettings({ bitcoinUnit: bitcoinUnit.unit });
					},
					hide: false,
					Icon: bitcoinUnit.Icon,
				})),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedBitcoinUnit],
	);

	return (
		<SettingsView
			title={'Bitcoin Unit'}
			listData={CurrencyListData}
			showBackNavigation
		/>
	);
};

export default memo(BitcoinUnitSettings);
