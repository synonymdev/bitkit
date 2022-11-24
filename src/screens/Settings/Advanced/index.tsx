import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import Store from './../../../store/types';
import { IListData, ItemData } from '../../../components/List';
import SettingsView from '../SettingsView';
import type { SettingsScreenProps } from '../../../navigation/types';

const typesDescriptions = {
	p2wpkh: 'Bech32',
	p2sh: 'Segwit',
	p2pkh: 'Legacy',
};

const networkLabels = {
	bitcoin: 'Mainnet',
	bitcoinTestnet: 'Testnet',
	bitcoinRegtest: 'Regtest',
};

const AdvancedSettings = ({
	navigation,
}: SettingsScreenProps<'AdvancedSettings'>): ReactElement => {
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const selectedAddressType = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet].addressType[selectedNetwork],
	);

	const enableDevOptions = useSelector(
		(state: Store) => state.settings.enableDevOptions,
	);

	const SettingsListData: IListData[] = useMemo(() => {
		const payments: ItemData[] = [
			{
				title: 'Bitcoin address type',
				type: 'button',
				value: typesDescriptions[selectedAddressType],
				onPress: (): void => navigation.navigate('AddressTypePreference'),
			},
			{
				title: 'Coin selection',
				type: 'button',
				onPress: (): void => navigation.navigate('CoinSelectPreference'),
			},
			{
				title: 'Payment preference',
				type: 'button',
				onPress: (): void => navigation.navigate('PaymentPreference'),
			},
			{
				title: 'Instant payments',
				type: 'button',
				onPress: (): void => navigation.navigate('BlocktankOrders'),
			},
		];

		const networks: ItemData[] = [
			{
				title: 'Lightning node',
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
			networks.push({
				title: 'Bitcoin Network',
				value: networkLabels[selectedNetwork],
				type: 'button',
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
