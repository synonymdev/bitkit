import React, { memo, ReactElement, useMemo } from 'react';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { EAvailableNetworks } from '../../../utils/networks';
import {
	updateAddressIndexes,
	updateWallet,
} from '../../../store/actions/wallet';
import { resetActivityStore } from '../../../store/actions/activity';
import { getNetworkData } from '../../../utils/helpers';
import { startWalletServices } from '../../../utils/startup';
import {
	getCurrentWallet,
	getSelectedAddressType,
} from '../../../utils/wallet';

const BitcoinNetworkSelection = ({ navigation }): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const Networks: IListData[] = useMemo(
		() => [
			{
				title: 'Bitcoin Network Selection',
				data: Object.values(EAvailableNetworks).map((network) => {
					const networkData = getNetworkData({ selectedNetwork: network });
					return {
						title: `${networkData.label}`,
						value: network === selectedNetwork,
						type: 'button',
						onPress: async (): Promise<void> => {
							navigation.goBack();
							// Wipe existing activity
							resetActivityStore();
							// Switch to new network.
							await updateWallet({ selectedNetwork: network });
							// Grab the selectedWallet.
							const { selectedWallet } = getCurrentWallet({
								selectedNetwork: network,
							});
							const addressType = getSelectedAddressType({
								selectedNetwork: network,
								selectedWallet,
							});
							// Generate addresses if none exist for the newly selected wallet and network.
							await updateAddressIndexes({
								selectedWallet,
								selectedNetwork: network,
								addressType,
							});
							// Start wallet services with the newly selected network.
							await startWalletServices({});
						},
						hide: false,
					};
				}),
			},
		],
		[navigation, selectedNetwork],
	);

	return (
		<SettingsView
			title={'Bitcoin Networks'}
			listData={Networks}
			showBackNavigation
		/>
	);
};

export default memo(BitcoinNetworkSelection);
