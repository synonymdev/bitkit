import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import {
	updateAddressIndexes,
	updateWallet,
} from '../../../store/actions/wallet';
import {
	resetActivityStore,
	updateActivityList,
} from '../../../store/actions/activity';
import { updateOnchainFeeEstimates } from '../../../store/actions/fees';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { connectToElectrum } from '../../../utils/wallet/electrum';
import { startWalletServices } from '../../../utils/startup';
import { EAvailableNetworks } from '../../../utils/networks';
import { getNetworkData } from '../../../utils/helpers';
import { resetLdk } from '../../../utils/lightning';
import {
	getCurrentWallet,
	getSelectedAddressType,
} from '../../../utils/wallet';
import { SettingsScreenProps } from '../../../navigation/types';

const BitcoinNetworkSelection = ({
	navigation,
}: SettingsScreenProps<'BitcoinNetworkSelection'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: Object.values(EAvailableNetworks).map((network) => {
					const networkData = getNetworkData({ selectedNetwork: network });
					return {
						title: networkData.label,
						value: network === selectedNetwork,
						type: EItemType.button,
						onPress: async (): Promise<void> => {
							navigation.goBack();
							// Wipe existing activity
							resetActivityStore();
							// Switch to new network.
							updateWallet({ selectedNetwork: network });
							// Grab the selectedWallet.
							const { selectedWallet } = getCurrentWallet({
								selectedNetwork: network,
							});
							const addressType = getSelectedAddressType({
								selectedNetwork: network,
								selectedWallet,
							});
							// Connect to a Electrum Server on the network
							await connectToElectrum({ selectedNetwork: network });
							// Generate addresses if none exist for the newly selected wallet and network.
							await updateAddressIndexes({
								selectedWallet,
								selectedNetwork: network,
								addressType,
							});
							// Switching networks requires us to reset LDK.
							await resetLdk();
							// Start wallet services with the newly selected network.
							await startWalletServices({ selectedNetwork: network });
							await updateOnchainFeeEstimates({
								selectedNetwork: network,
								forceUpdate: true,
							});
							await updateActivityList();
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
