import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import {
	coinSelectAutoSelector,
	coinSelectPreferenceSelector,
} from '../../../store/reselect/settings';

const CoinSelectSettings = (): ReactElement => {
	const selectedAutoPilot = useSelector(coinSelectAutoSelector);
	const coinSelectPreference = useSelector(coinSelectPreferenceSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Coin Selection Method',
				data: [
					{
						title: 'Manual',
						value: !selectedAutoPilot,
						type: EItemType.button,
						onPress: (): void => {
							updateSettings({ coinSelectAuto: false });
						},
					},
					{
						title: 'Autopilot',
						value: selectedAutoPilot,
						type: EItemType.button,
						onPress: (): void => {
							updateSettings({ coinSelectAuto: true });
						},
					},
				],
			},
			{
				title: selectedAutoPilot ? 'Autopilot Mode' : '',
				data: [
					{
						title: 'Consolidate',
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
						title: 'Maximum Privacy',
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
						title: 'Minimum UTXOs',
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
		[selectedAutoPilot, coinSelectPreference],
	);

	return (
		<SettingsView
			title="Coin Selection"
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(CoinSelectSettings);
