import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData, ItemData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import { EAddressType } from '../../../store/types/wallet';
import {
	addressTypeSelector,
	selectedWalletSelector,
	selectedNetworkSelector,
} from '../../../store/reselect/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';
import { rescanAddresses } from '../../../utils/wallet';
import { updateTransactions } from '../../../store/actions/wallet';

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
	const { t } = useTranslation('settings');
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedAddressType = useSelector(addressTypeSelector);
	const enableDevOptions = useSelector(enableDevOptionsSelector);

	const [rescanning, setRescanning] = useState(false);

	const SettingsListData: IListData[] = useMemo(() => {
		const payments: ItemData[] = [
			{
				title: t('adv.address_type'),
				type: EItemType.button,
				value: typesDescriptions[selectedAddressType],
				onPress: (): void => navigation.navigate('AddressTypePreference'),
				testID: 'AddressTypePreference',
			},
			{
				title: t('adv.coin_selection'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('CoinSelectPreference'),
			},
			{
				title: t('adv.payment_preference'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('PaymentPreference'),
			},
			{
				title: t('adv.address_viewer'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('AddressViewer'),
				testID: 'AddressViewer',
			},
			{
				title: t('adv.rescan'),
				value: rescanning ? 'Rescanning...' : '',
				type: EItemType.textButton,
				enabled: !rescanning,
				onPress: async (): Promise<void> => {
					setRescanning(true);
					await rescanAddresses({ selectedWallet, selectedNetwork });
					await updateTransactions({
						scanAllAddresses: true,
						replaceStoredTransactions: true,
						selectedWallet,
						selectedNetwork,
						showNotification: false,
					});
					setRescanning(false);
				},
			},
		];

		const networks: ItemData[] = [
			{
				title: t('adv.lightning_connections'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('Channels'),
				testID: 'Channels',
			},
			{
				title: t('adv.lightning_node'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('LightningNodeInfo'),
				testID: 'LightningNodeInfo',
			},
			{
				title: t('adv.electrum_server'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('ElectrumConfig'),
				testID: 'ElectrumConfig',
			},
		];

		if (enableDevOptions) {
			networks.push({
				title: t('adv.bitcoin_network'),
				value: networkLabels[selectedNetwork],
				type: EItemType.button,
				onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
			});
		}

		return [
			{
				title: t('adv.section_payments'),
				data: payments,
			},
			{
				title: t('adv.section_networks'),
				data: networks,
			},
		];
	}, [
		selectedAddressType,
		rescanning,
		enableDevOptions,
		navigation,
		selectedWallet,
		selectedNetwork,
		t,
	]);

	return (
		<SettingsView
			title={t('advanced_title')}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AdvancedSettings);
