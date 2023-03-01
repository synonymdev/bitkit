import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import {
	coinSelectAutoSelector,
	coinSelectPreferenceSelector,
} from '../../../store/reselect/settings';

const CoinSelectSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedAutoPilot = useSelector(coinSelectAutoSelector);
	const coinSelectPreference = useSelector(coinSelectPreferenceSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: t('adv.cs_method'),
				data: [
					{
						title: t('adv.cs_manual'),
						value: !selectedAutoPilot,
						type: EItemType.button,
						onPress: (): void => {
							updateSettings({ coinSelectAuto: false });
						},
					},
					{
						title: t('adv.cs_auto'),
						value: selectedAutoPilot,
						type: EItemType.button,
						onPress: (): void => {
							updateSettings({ coinSelectAuto: true });
						},
					},
				],
			},
			{
				title: selectedAutoPilot ? t('adv.cs_auto_mode') : '',
				data: [
					{
						title: t('adv.cs_consolidate'),
						value: coinSelectPreference === 'consolidate',
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'consolidate',
							});
						},
					},
					{
						title: t('adv.cs_max'),
						value: coinSelectPreference === 'large',
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'large',
							});
						},
					},
					{
						title: t('adv.cs_min'),
						value: coinSelectPreference === 'small',
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'small',
							});
						},
					},
				],
			},
		],
		[selectedAutoPilot, coinSelectPreference, t],
	);

	return (
		<SettingsView
			title={t('adv.coin_selection')}
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(CoinSelectSettings);
