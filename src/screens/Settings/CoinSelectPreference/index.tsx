import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Result } from '@synonymdev/result';

import { View as ThemedView } from '../../../styles/components';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';

const CoinSelectSettings = (): ReactElement => {
	const selectedAutoPilot = useSelector(
		(state: Store) => state.settings.coinSelectAuto,
	);
	const coinSelectPreference = useSelector(
		(state: Store) => state.settings.coinSelectPreference,
	);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Coin Selection Method',
				data: [
					{
						title: 'Manual',
						value: !selectedAutoPilot,
						type: 'button',
						onPress: (): void => {
							updateSettings({ coinSelectAuto: false });
						},
						hide: false,
					},
					{
						title: 'Autopilot',
						value: selectedAutoPilot,
						type: 'button',
						onPress: (): void => {
							updateSettings({ coinSelectAuto: true });
						},
						hide: false,
					},
				],
			},
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
		[selectedAutoPilot, coinSelectPreference],
	);

	return (
		<ThemedView color="black" style={styles.container}>
			<SettingsView
				title="Coin Selection"
				listData={settingsListData}
				showBackNavigation
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(CoinSelectSettings);
