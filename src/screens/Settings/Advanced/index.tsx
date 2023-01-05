import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { EItemType, IListData, ItemData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import { EAddressType } from '../../../store/types/wallet';
import {
	addressTypeSelector,
	selectedNetworkSelector,
} from '../../../store/reselect/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';

const typesDescriptions = {
	[EAddressType.p2wpkh]: 'Native Segwit',
	[EAddressType.p2sh]: 'Segwit',
	[EAddressType.p2pkh]: 'Legacy',
};

const networkLabels = {
	bitcoin: 'Mainnet',
	bitcoinTestnet: 'Testnet',
	bitcoinRegtest: 'Regtest',
};

const AdvancedSettings = ({
	navigation,
}: SettingsScreenProps<'AdvancedSettings'>): ReactElement => {
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedAddressType = useSelector(addressTypeSelector);
	const enableDevOptions = useSelector(enableDevOptionsSelector);

	const SettingsListData: IListData[] = useMemo(() => {
		const payments: ItemData[] = [
			{
				title: 'Bitcoin Address Type',
				type: EItemType.button,
				value: typesDescriptions[selectedAddressType],
				onPress: (): void => navigation.navigate('AddressTypePreference'),
			},
			{
				title: 'Coin Selection',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('CoinSelectPreference'),
			},
			{
				title: 'Payment Preference',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('PaymentPreference'),
			},
			{
				title: 'Blocktank Orders',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('BlocktankOrders'),
			},
		];

		const networks: ItemData[] = [
			{
				title: 'Lightning Connections',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('Channels'),
			},
			{
				title: 'Lightning Node',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('LightningNodeInfo'),
			},
			{
				title: 'Electrum Server',
				type: EItemType.button,
				onPress: (): void => navigation.navigate('ElectrumConfig'),
			},
		];

		if (enableDevOptions) {
			networks.push({
				title: 'Bitcoin Network',
				value: networkLabels[selectedNetwork],
				type: EItemType.button,
				onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
			});
		}

		return [
			{
				title: 'Payments',
				data: payments,
			},
			{
				title: 'Networks',
				data: networks,
			},
		];
	}, [navigation, selectedAddressType, selectedNetwork, enableDevOptions]);

	return (
		<SettingsView
			title="Advanced"
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AdvancedSettings);
