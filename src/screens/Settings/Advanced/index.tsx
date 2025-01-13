import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';

import Dialog from '../../../components/Dialog';
import { EItemType, IListData, ItemData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import {
	addressTypeSelector,
	selectedNetworkSelector,
} from '../../../store/reselect/wallet';
import { addressTypes } from '../../../store/shapes/wallet';
import { resetHiddenTodos } from '../../../store/slices/todos';
import { networkLabels } from '../../../utils/networks';
import { rescanAddresses } from '../../../utils/wallet';
import SettingsView from '../SettingsView';

const AdvancedSettings = ({
	navigation,
}: SettingsScreenProps<'AdvancedSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedAddressType = useAppSelector(addressTypeSelector);
	const enableDevOptions = useAppSelector(enableDevOptionsSelector);
	const [rescanning, setRescanning] = useState(false);
	const [showDialog, setShowDialog] = useState(false);

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
			{
				title: t('adv.gap_limit'),
				type: EItemType.button,
				onPress: (): void => navigation.navigate('GapLimit'),
				testID: 'GapLimit',
				hide: !enableDevOptions,
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
					await rescanAddresses({});
					// await wallet.updateTransactions({
					// 	scanAllAddresses: true,
					// 	replaceStoredTransactions: true,
					// });
					setRescanning(false);
				},
			},
			{
				title: t('adv.suggestions_reset'),
				type: EItemType.button,
				testID: 'ResetSuggestions',
				onPress: (): void => setShowDialog(true),
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
		selectedNetwork,
		t,
	]);

	return (
		<>
			<SettingsView title={t('advanced_title')} listData={SettingsListData} />
			<Dialog
				visible={showDialog}
				title={t('adv.reset_title')}
				description={t('adv.reset_desc')}
				confirmText={t('adv.reset_confirm')}
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					dispatch(resetHiddenTodos());
					setShowDialog(false);
					navigation.popTo('Wallet', { screen: 'Wallets' });
				}}
			/>
		</>
	);
};

export default memo(AdvancedSettings);
