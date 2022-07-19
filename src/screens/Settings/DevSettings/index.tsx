import React, { memo, ReactElement, useMemo } from 'react';
import Store from '../../../store/types';
import { useSelector } from 'react-redux';
import {
	resetSettingsStore,
	wipeWallet,
} from '../../../store/actions/settings';
import { IListData } from '../../../components/List';
import {
	resetSelectedWallet,
	resetWalletStore,
} from '../../../store/actions/wallet';
import { resetUserStore } from '../../../store/actions/user';
import { resetActivityStore } from '../../../store/actions/activity';
import { resetLightningStore } from '../../../store/actions/lightning';
import { resetBlocktankStore } from '../../../store/actions/blocktank';
import SettingsView from './../SettingsView';
import { resetSlashtagsStore } from '../../../store/actions/slashtags';
import { clearSlashtagsStorage } from '../../../components/SlashtagsProvider';

const SettingsMenu = ({ navigation }): ReactElement => {
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const remoteBackupSynced = useSelector(
		(state: Store) => state.backup.backpackSynced,
	);
	const rbf = useSelector((state: Store) => state.settings?.rbf ?? true);

	const hasPin = useSelector((state: Store) => state.settings.pin);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'Dev Settings',
				data: [
					{
						title: 'Bitcoin Network Selection',
						type: 'button',
						onPress: (): void => navigation.navigate('BitcoinNetworkSelection'),
						hide: false,
					},
					{
						title: 'Reset Current Wallet Store',
						type: 'button',
						onPress: async (): Promise<void> => {
							await resetSelectedWallet({ selectedWallet });
						},
						hide: false,
					},
					{
						title: 'Reset Entire Wallet Store',
						type: 'button',
						onPress: resetWalletStore,
						hide: false,
					},
					{
						title: 'Reset Lightning Store',
						type: 'button',
						onPress: resetLightningStore,
						hide: false,
					},
					{
						title: 'Reset Settings Store',
						type: 'button',
						onPress: resetSettingsStore,
						hide: false,
					},
					{
						title: 'Reset Activity Store',
						type: 'button',
						onPress: resetActivityStore,
						hide: false,
					},
					{
						title: 'Reset User Store',
						type: 'button',
						onPress: resetUserStore,
						hide: false,
					},
					{
						title: 'Reset Blocktank Store',
						type: 'button',
						onPress: resetBlocktankStore,
						hide: false,
					},
					{
						title: 'Reset Slashtags store',
						type: 'button',
						onPress: () => resetSlashtagsStore(),
						hide: false,
					},
					{
						title: 'Clear Slashtags storage',
						type: 'button',
						onPress: () => clearSlashtagsStorage(),
						hide: false,
					},
					{
						title: 'Reset All Stores',
						type: 'button',
						onPress: async (): Promise<void> => {
							await Promise.all([
								resetWalletStore(),
								resetLightningStore(),
								resetSettingsStore(),
								resetActivityStore(),
								resetUserStore(),
								resetBlocktankStore(),
								resetSlashtagsStore(),
							]);
						},
						hide: false,
					},
					{
						title: 'Wipe Wallet Data',
						type: 'button',
						onPress: wipeWallet,
						hide: false,
					},
				],
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[hasPin, remoteBackupSynced, selectedWallet, rbf],
	);

	return (
		<SettingsView
			title={'Dev Settings'}
			listData={SettingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(SettingsMenu);
