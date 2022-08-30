import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IListData } from '../../../components/List';
import Store from '../../../store/types';
import SettingsView from '../SettingsView';

const NetworksSettings = ({ navigation }): ReactElement => {
	const networkLabels = {
		bitcoin: 'Mainnet',
		bitcoinTestnet: 'Testnet',
		bitcoinRegtest: 'Regtest',
	};

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Bitcoin Network',
						value: networkLabels[selectedNetwork],
						type: 'button',
						onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
						hide: false,
					},
					{
						title: 'Lightning Node Info',
						type: 'button',
						onPress: (): void => navigation.navigate('LightningNodeInfo'),
						hide: false,
					},
					{
						title: 'Lightning connections',
						type: 'button',
						onPress: (): void => navigation.navigate('Channels'),
						hide: false,
					},
					{
						title: 'Electrum Server',
						type: 'button',
						onPress: (): void => navigation.navigate('ElectrumConfig'),
						hide: false,
					},
				],
			},
		],
		[navigation, networkLabels, selectedNetwork],
	);

	return (
		<SettingsView
			title={'Networks'}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(NetworksSettings);
