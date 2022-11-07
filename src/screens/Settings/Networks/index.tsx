import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IListData, ItemData } from '../../../components/List';
import { SettingsScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';
import SettingsView from '../SettingsView';

const networkLabels = {
	bitcoin: 'Mainnet',
	bitcoinTestnet: 'Testnet',
	bitcoinRegtest: 'Regtest',
};

const NetworksSettings = ({
	navigation,
}: SettingsScreenProps<'NetworksSettings'>): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const enableDevOptions = useSelector(
		(state: Store) => state.settings.enableDevOptions,
	);

	const SettingsListData: IListData[] = useMemo(() => {
		const data: ItemData[] = [
			{
				title: 'Lightning Node Info',
				type: 'button',
				onPress: (): void => navigation.navigate('LightningNodeInfo'),
			},
			{
				title: 'Lightning connections',
				type: 'button',
				onPress: (): void => navigation.navigate('Channels'),
			},
			{
				title: 'Electrum Server',
				type: 'button',
				onPress: (): void => navigation.navigate('ElectrumConfig'),
			},
		];

		if (enableDevOptions) {
			data.push({
				title: 'Bitcoin Network',
				value: networkLabels[selectedNetwork],
				type: 'button',
				onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
			});
		}
		return [{ data }];
	}, [enableDevOptions, navigation, selectedNetwork]);

	return (
		<SettingsView
			title="Networks"
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(NetworksSettings);
