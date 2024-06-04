import React, { memo, ReactElement, useMemo } from 'react';
import { useAppSelector } from '../../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { networkLabels } from '../../../utils/networks';
import { switchNetwork } from '../../../utils/wallet';
import { SettingsScreenProps } from '../../../navigation/types';
import { startWalletServices } from '../../../utils/startup';
import { showToast } from '../../../utils/notifications';

const BitcoinNetworkSelection = ({
	navigation,
}: SettingsScreenProps<'BitcoinNetworkSelection'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const [loading, setLoading] = React.useState(false);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: Object.values(networkLabels).map((network) => {
					return {
						title: network.label,
						value: network.id === selectedNetwork,
						type: EItemType.button,
						loading,
						onPress: async (): Promise<void> => {
							setLoading(true);
							const switchNetworkRes = await switchNetwork(network.id);
							if (switchNetworkRes.isErr()) {
								setLoading(false);
								showToast({
									type: 'error',
									title: 'Error Switching Networks',
									description: 'Please try again.',
								});
								return;
							}
							// Start wallet services with the newly selected network.
							await startWalletServices({ selectedNetwork: network.id });
							setLoading(false);
							navigation.goBack();
						},
					};
				}),
			},
		],
		[loading, navigation, selectedNetwork],
	);

	return (
		<SettingsView
			title={t('adv.bitcoin_network')}
			listData={settingsListData}
		/>
	);
};

export default memo(BitcoinNetworkSelection);
