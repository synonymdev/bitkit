import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
	denominationSelector,
	selectedCurrencySelector,
	unitSelector,
} from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import { EDenomination, EUnit } from '../../../store/types/wallet';
import { UnitBitcoinIcon, UnitFiatIcon } from '../../../styles/icons';
import SettingsView from '../SettingsView';

const UnitSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedUnit = useAppSelector(unitSelector);
	const selectedDenomination = useAppSelector(denominationSelector);
	const selectedCurrency = useAppSelector(selectedCurrencySelector);

	const currencyListData: IListData[] = useMemo(() => {
		const units = [
			{
				label: t('general.unit_bitcoin'),
				unit: EUnit.BTC,
				Icon: UnitBitcoinIcon,
			},
			{
				label: selectedCurrency,
				unit: EUnit.fiat,
				Icon: UnitFiatIcon,
			},
		];

		const denominations = [
			{
				label: t('general.denomination_modern'),
				value: EDenomination.modern,
				testId: 'DenominationModern',
			},
			{
				label: t('general.denomination_classic'),
				value: EDenomination.classic,
				testId: 'DenominationClassic',
			},
		];

		return [
			{
				title: t('general.unit_display'),
				description: t('general.unit_note', { currency: selectedCurrency }),
				data: units.map((unit) => ({
					title: unit.label,
					value: unit.unit === selectedUnit,
					type: EItemType.button,
					Icon: unit.Icon,
					testID: unit.label,
					onPress: (): void => {
						dispatch(updateSettings({ unit: unit.unit }));
					},
				})),
			},
			{
				title: t('general.denomination_label'),
				data: denominations.map((denomination) => ({
					title: denomination.label,
					value: denomination.value === selectedDenomination,
					type: EItemType.button,
					testID: denomination.testId,
					onPress: (): void => {
						dispatch(updateSettings({ denomination: denomination.value }));
					},
				})),
			},
		];
	}, [selectedUnit, selectedCurrency, selectedDenomination, t, dispatch]);

	return (
		<SettingsView title={t('general.unit_title')} listData={currencyListData} />
	);
};

export default memo(UnitSettings);
