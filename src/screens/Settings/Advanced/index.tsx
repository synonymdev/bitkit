import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData, ItemData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import { updateTransactions } from '../../../store/actions/wallet';
import { addressTypes } from '../../../store/shapes/wallet';
import {
	addressTypeSelector,
	selectedWalletSelector,
	selectedNetworkSelector,
} from '../../../store/reselect/wallet';
import { rescanAddresses } from '../../../utils/wallet';
import { networkLabels } from '../../../utils/networks';
import type { SettingsScreenProps } from '../../../navigation/types';

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
				value: addressTypes[selectedAddressType].shortName,
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
			{
				title: t('adv.rgs_server'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('RGSServer'),
				testID: 'RGSServer',
			},
			{
				title: t('adv.web_relay'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('WebRelay'),
				testID: 'WebRelay',
			},
			{
				title: t('adv.bitcoin_network'),
				value: networkLabels[selectedNetwork].shortLabel,
				type: EItemType.button,
				hide: !enableDevOptions,
				onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
			},
		];

		const other: ItemData[] = [
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
					});
					setRescanning(false);
				},
			},
		];

		return [
			{
				title: t('adv.section_payments'),
				data: payments,
			},
			{
				title: t('adv.section_networks'),
				data: networks,
			},
			{
				title: t('adv.section_other'),
				data: other,
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
