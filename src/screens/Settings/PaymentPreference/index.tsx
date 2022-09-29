import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../../styles/components';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import { updateSlashPayConfig } from '../../../utils/slashtags';

const PaymentPreference = (): ReactElement => {
	const sdk = useSlashtagsSDK();
	const receivePreference = useSelector(
		(state: Store) => state.settings.receivePreference,
	);
	const enableOfflinePayments = useSelector(
		(state: Store) => state.settings.enableOfflinePayments,
	);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Payment preference (drag to reorder)',
				data: [
					{
						title: 'Payment preference (drag to reorder)',
						type: 'draggable',
						value: receivePreference,
						hide: false,
						onDragEnd: (data): void => {
							updateSettings({ receivePreference: data });
						},
					},
				],
			},
			{
				title: 'Offline payments',
				data: [
					{
						title: 'Enable offline payments',
						type: 'switch',
						enabled: enableOfflinePayments,
						hide: false,
						onPress: (): void => {
							updateSettings({ enableOfflinePayments: !enableOfflinePayments });
							updateSlashPayConfig(sdk, { p2wpkh: !enableOfflinePayments });
						},
					},
				],
			},
		],
		[receivePreference, enableOfflinePayments],
	);

	return (
		<ThemedView color="black" style={styles.container}>
			<SettingsView
				title="Payment Preference"
				listData={settingsListData}
				headerText="Choose how you prefer to receive money when users send funds to your Slashtag."
				footerText="Bitkit will create a fixed Bitcoin address for you, so you can receive payments from contacts, even when you are offline."
				showBackNavigation
				fullHeight={false}
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(PaymentPreference);
