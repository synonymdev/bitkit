import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../../styles/components';
import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import { updateSlashPayConfig } from '../../../utils/slashtags';
import {
	enableOfflinePaymentsSelector,
	receivePreferenceSelector,
} from '../../../store/reselect/settings';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const PaymentPreference = (): ReactElement => {
	const sdk = useSlashtagsSDK();
	const receivePreference = useSelector(receivePreferenceSelector);
	const enableOfflinePayments = useSelector(enableOfflinePaymentsSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Payment preference (drag to reorder)',
				data: [
					{
						title: 'Payment preference (drag to reorder)',
						type: EItemType.draggable,
						value: receivePreference,
						onDragEnd: (data): void => {
							updateSettings({ receivePreference: data });
						},
					},
				],
			},
			{
				title: 'Pay to/from contacts',
				data: [
					{
						title: 'Enable payments with contacts*',
						type: EItemType.switch,
						enabled: enableOfflinePayments,
						onPress: (): void => {
							updateSettings({ enableOfflinePayments: !enableOfflinePayments });
							updateSlashPayConfig({ sdk, selectedWallet, selectedNetwork });
						},
					},
				],
			},
		],
		[
			receivePreference,
			enableOfflinePayments,
			sdk,
			selectedWallet,
			selectedNetwork,
		],
	);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title="Payment Preference"
				listData={settingsListData}
				headerText="Choose how you prefer to receive money when users send funds to your profile key."
				footerText="* This requires sharing payment data."
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
