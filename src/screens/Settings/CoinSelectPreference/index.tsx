import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';

import { EItemType, IListData } from '../../../components/List';
import { coinSelectAutoSelector } from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import SettingsView from '../SettingsView';

const CoinSelectSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedAutoPilot = useAppSelector(coinSelectAutoSelector);
	//const coinSelectPreference = useAppSelector(coinSelectPreferenceSelector);

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
							dispatch(updateSettings({ coinSelectAuto: false }));
						},
					},
					{
						title: t('adv.cs_auto'),
						value: selectedAutoPilot,
						type: EItemType.button,
						onPress: (): void => {
							dispatch(updateSettings({ coinSelectAuto: true }));
						},
					},
				],
			},
			/*{
			// TODO: Re-Add and enable this feature once thoroughly tested in Beignet.
			title: selectedAutoPilot ? t('adv.cs_auto_mode') : '',
			data: [
				{
					title: t('adv.cs_max'),
					description: t('adv.cs_max_description'),
					value: coinSelectPreference === 'large',
					type: EItemType.button,
					hide: !selectedAutoPilot,
					onPress: (): void => {
						dispatch(
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'large',
							}),
						);
					},
				},
				{
					title: t('adv.cs_min'),
					description: t('adv.cs_min_description'),
					value: coinSelectPreference === 'small',
					type: EItemType.button,
					hide: !selectedAutoPilot,
					onPress: (): void => {
						dispatch(
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'small',
							}),
						);
					},
				},
				{
					title: t('adv.cs_consolidate'),
					description: t('adv.cs_consolidate_description'),
					value: coinSelectPreference === 'consolidate',
					type: EItemType.button,
					hide: !selectedAutoPilot,
					onPress: (): void => {
						dispatch(
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'consolidate',
							}),
						);
					},
				},
			],
			},*/
		],
		[selectedAutoPilot, t, dispatch],
	);

	return (
		<SettingsView title={t('adv.coin_selection')} listData={settingsListData} />
	);
};

export default memo(CoinSelectSettings);
