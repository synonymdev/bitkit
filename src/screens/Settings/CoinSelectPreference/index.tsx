import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Result } from '@synonymdev/result';

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
						onPress: (): Result<string> =>
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'consolidate',
							}),
						hide: !selectedAutoPilot,
					},
					{
						title: 'Maximum Privacy',
						value: coinSelectPreference === 'large',
						type: EItemType.button,
						onPress: (): Result<string> =>
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'large',
							}),
						hide: !selectedAutoPilot,
					},
					{
						title: 'Minimum UTXOs',
						value: coinSelectPreference === 'small',
						type: EItemType.button,
						onPress: (): Result<string> =>
							updateSettings({
								coinSelectAuto: true,
								coinSelectPreference: 'small',
							}),
						hide: !selectedAutoPilot,
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
