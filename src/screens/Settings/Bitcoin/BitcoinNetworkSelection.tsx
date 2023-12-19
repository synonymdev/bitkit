import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { updateWallet } from '../../../store/actions/wallet';
import {
	resetActivityStore,
	updateActivityList,
} from '../../../store/actions/activity';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { startWalletServices } from '../../../utils/startup';
import { networkLabels } from '../../../utils/networks';
import { switchNetwork } from '../../../utils/wallet';
import { SettingsScreenProps } from '../../../navigation/types';

const BitcoinNetworkSelection = ({
	navigation,
}: SettingsScreenProps<'BitcoinNetworkSelection'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: Object.values(networkLabels).map((network) => {
					return {
						title: network.label,
						value: network.id === selectedNetwork,
						type: EItemType.button,
						onPress: async (): Promise<void> => {
							navigation.goBack();
							//await ldk.stop();
							// Wipe existing activity
							resetActivityStore();
							// Switch to new network.
							updateWallet({ selectedNetwork: network.id });
							await switchNetwork(network.id);
							// Start wallet services with the newly selected network.
							await startWalletServices({
								selectedNetwork: network.id,
							});
							updateActivityList();
						},
					};
				}),
			},
		],
		[navigation, selectedNetwork],
	);

	return (
		<SettingsView
			title={t('adv.bitcoin_network')}
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(BitcoinNetworkSelection);
