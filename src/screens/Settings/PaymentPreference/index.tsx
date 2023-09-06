import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { arraysMatch } from '../../../utils/helpers';
import { updateSlashPayConfig2 } from '../../../utils/slashtags2';
import { updateSettings } from '../../../store/actions/settings';
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
	const receivePreference = useSelector(receivePreferenceSelector);
	const enableOfflinePayments = useSelector(enableOfflinePaymentsSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

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
							updateSettings({ receivePreference: data });

							if (!arraysMatch(receivePreference, data)) {
								updateSlashPayConfig2({
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
							updateSettings({ enableOfflinePayments: !enableOfflinePayments });
							updateSlashPayConfig2({ selectedWallet, selectedNetwork });
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
			t,
		],
	);

	return (
		<ThemedView style={styles.container}>
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
	container: {
		flex: 1,
	},
});

export default memo(PaymentPreference);
