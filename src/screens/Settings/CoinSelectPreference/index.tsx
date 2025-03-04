import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';

import { ECoinSelectPreference } from 'beignet';
import { EItemType, IListData } from '../../../components/List';
import {
	coinSelectAutoSelector,
	coinSelectPreferenceSelector,
} from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import { updateCoinSelectPreference } from '../../../utils/settings';
import { getOnChainWalletAsync } from '../../../utils/wallet';
import SettingsView from '../SettingsView';

const CoinSelectSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedAutoPilot = useAppSelector(coinSelectAutoSelector);
	const coinSelectPreference = useAppSelector(coinSelectPreferenceSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: t('adv.cs_method'),
				data: [
					{
						title: t('adv.cs_manual'),
						value: !selectedAutoPilot,
						type: EItemType.button,
						onPress: async (): Promise<void> => {
							// Update the coin selection preference in beignet.
							const wallet = await getOnChainWalletAsync();
							// Set beignet to consolidate if manual coin control is enabled in Bitkit.
							wallet.updateCoinSelectPreference(
								ECoinSelectPreference.consolidate,
							);
							dispatch(updateSettings({ coinSelectAuto: false }));
						},
					},
					{
						title: t('adv.cs_auto'),
						value: selectedAutoPilot,
						type: EItemType.button,
						onPress: async (): Promise<void> => {
							// Update the coin selection preference in beignet.
							const wallet = await getOnChainWalletAsync();
							wallet.updateCoinSelectPreference(coinSelectPreference);
							dispatch(updateSettings({ coinSelectAuto: true }));
						},
					},
				],
			},
			{
				title: selectedAutoPilot ? t('adv.cs_auto_mode') : '',
				data: [
					{
						title: t('adv.cs_max'),
						description: t('adv.cs_max_description'),
						value: coinSelectPreference === ECoinSelectPreference.small,
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateCoinSelectPreference(ECoinSelectPreference.small);
						},
					},
					{
						title: t('adv.cs_min'),
						description: t('adv.cs_min_description'),
						value: coinSelectPreference === ECoinSelectPreference.large,
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateCoinSelectPreference(ECoinSelectPreference.large);
						},
					},
					{
						title: t('adv.cs_consolidate'),
						description: t('adv.cs_consolidate_description'),
						value: coinSelectPreference === ECoinSelectPreference.consolidate,
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateCoinSelectPreference(ECoinSelectPreference.consolidate);
						},
					},
					{
						title: t('adv.cs_first_in_first_out'),
						description: t('adv.cs_first_in_first_out_description'),
						value:
							coinSelectPreference === ECoinSelectPreference.firstInFirstOut,
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateCoinSelectPreference(ECoinSelectPreference.firstInFirstOut);
						},
					},
					{
						title: t('adv.cs_last_in_last_out'),
						description: t('adv.cs_last_in_last_out_description'),
						value:
							coinSelectPreference === ECoinSelectPreference.lastInFirstOut,
						type: EItemType.button,
						hide: !selectedAutoPilot,
						onPress: (): void => {
							updateCoinSelectPreference(ECoinSelectPreference.lastInFirstOut);
						},
					},
				],
			},
		],
		[selectedAutoPilot, coinSelectPreference, t, dispatch],
	);

	return (
		<SettingsView title={t('adv.coin_selection')} listData={settingsListData} />
	);
};

export default memo(CoinSelectSettings);
