import React, { memo, ReactElement, useMemo } from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import { FlatList } from 'react-native';
import { Result } from '../../../utils/result';

const CoinSelectSettings = (): ReactElement => {
	const selectedAutoPilot = useSelector(
		(state: Store) => state.settings.coinSelectAuto,
	);
	const coinSelectPreference = useSelector(
		(state: Store) => state.settings.coinSelectPreference,
	);

	const SelectionMethod: IListData[] = useMemo(
		() => [
			{
				title: 'Coin Selection Method',
				data: [
					{
						title: 'Manual',
						value: !selectedAutoPilot,
						type: 'button',
						onPress: async (): Promise<any> =>
							updateSettings({ coinSelectAuto: false }),
						hide: false,
					},
					{
						title: 'Autopilot',
						value: selectedAutoPilot,
						type: 'button',
						onPress: async (): Promise<any> =>
							updateSettings({ coinSelectAuto: true }),
						hide: false,
					},
				],
			},
		],
		[selectedAutoPilot],
	);

	const AutoPilotMode: IListData[] = useMemo(
		() => [
			{
				title: selectedAutoPilot ? 'Autopilot Mode' : '',
				data: [
					{
						title: 'Consolidate',
						value: coinSelectPreference === 'consolidate',
						type: 'button',
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
						type: 'button',
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
						type: 'button',
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
		[coinSelectPreference, selectedAutoPilot],
	);

	const headerComponent = (
		<SettingsView
			title={'Coin selection'}
			listData={SelectionMethod}
			showBackNavigation
		/>
	);

	const footerComponent = (
		<SettingsView listData={AutoPilotMode} showBackNavigation={false} />
	);

	return (
		<FlatList
			data={null}
			renderItem={null}
			ListHeaderComponent={headerComponent}
			ListFooterComponent={footerComponent}
		/>
	);
};

export default memo(CoinSelectSettings);
