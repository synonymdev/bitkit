import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { UnitBitcoinIcon, UnitSatoshiIcon } from '../../../styles/icons';
import { bitcoinUnitSelector } from '../../../store/reselect/settings';
import { EBitcoinUnit } from '../../../store/types/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';

const BitcoinUnitSettings = ({
	navigation,
}: SettingsScreenProps<'BitcoinUnitSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedBitcoinUnit = useSelector(bitcoinUnitSelector);

	const currencyListData: IListData[] = useMemo(() => {
		const bitcoinUnits = [
			{
				label: t('general.unit_bitcoin'),
				unit: EBitcoinUnit.BTC,
				labelExample: '(0.0000100)',
				Icon: UnitBitcoinIcon,
			},
			{
				label: t('general.unit_sathoshis'),
				unit: EBitcoinUnit.satoshi,
				labelExample: '(1 000)',
				Icon: UnitSatoshiIcon,
			},
		];

		return [
			{
				title: t('general.unit_display'),
				data: bitcoinUnits.map((bitcoinUnit) => ({
					title: `${bitcoinUnit.label} ${bitcoinUnit.labelExample}`,
					value: bitcoinUnit.unit === selectedBitcoinUnit,
					type: EItemType.button,
					Icon: bitcoinUnit.Icon,
					onPress: (): void => {
						navigation.goBack();
						updateSettings({ bitcoinUnit: bitcoinUnit.unit });
					},
					testID: bitcoinUnit.label,
				})),
			},
		];
	}, [selectedBitcoinUnit, navigation, t]);

	return (
		<SettingsView
			title={t('general.unit_title')}
			listData={currencyListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(BitcoinUnitSettings);
