import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { arraysMatch } from '../../../utils/helpers';
import { updateSlashPayConfig } from '../../../utils/slashtags';
import { updateSettings } from '../../../store/slices/settings';
import {
	enableOfflinePaymentsSelector,
	receivePreferenceSelector,
} from '../../../store/reselect/settings';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const PaymentPreference = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const receivePreference = useAppSelector(receivePreferenceSelector);
	const enableOfflinePayments = useAppSelector(enableOfflinePaymentsSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: t('adv.pp_drag'),
				data: [
					{
						title: t('adv.pp_drag'),
						type: EItemType.draggable,
						value: receivePreference,
						onDragEnd: (data): void => {
							dispatch(updateSettings({ receivePreference: data }));

							if (!arraysMatch(receivePreference, data)) {
								updateSlashPayConfig({
									forceUpdate: true,
									selectedWallet,
									selectedNetwork,
								});
							}
						},
					},
				],
			},
			{
				title: t('adv.pp_contacts'),
				data: [
					{
						title: t('adv.pp_contacts_switch'),
						type: EItemType.switch,
						enabled: enableOfflinePayments,
						onPress: (): void => {
							dispatch(
								updateSettings({
									enableOfflinePayments: !enableOfflinePayments,
								}),
							);
							updateSlashPayConfig({ selectedWallet, selectedNetwork });
						},
					},
				],
			},
		],
		[
			receivePreference,
			enableOfflinePayments,
			selectedWallet,
			selectedNetwork,
			dispatch,
			t,
		],
	);

	return (
		<ThemedView style={styles.root}>
			<SettingsView
				title={t('adv.payment_preference')}
				listData={settingsListData}
				headerText={t('adv.pp_header')}
				footerText={t('adv.pp_footer')}
				showBackNavigation
				fullHeight={false}
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});

export default memo(PaymentPreference);
