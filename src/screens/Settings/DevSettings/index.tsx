import React, { memo, ReactElement, useState } from 'react';
import RNFS, { unlink, writeFile } from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';
import { startProfiling, stopProfiling } from 'react-native-release-profiler';

import actions from '../../../store/actions/actions';
import {
	clearUtxos,
	injectFakeTransaction,
	resetSelectedWallet,
	updateWallet,
} from '../../../store/actions/wallet';
import { resetUserState } from '../../../store/slices/user';
import { resetActivityState } from '../../../store/slices/activity';
import { resetBlocktankState } from '../../../store/slices/blocktank';
import { resetFeesState } from '../../../store/slices/fees';
import { resetLightningState } from '../../../store/slices/lightning';
import { resetMetadataState } from '../../../store/slices/metadata';
import { resetSettingsState } from '../../../store/slices/settings';
import { resetSlashtagsState } from '../../../store/slices/slashtags';
import { resetWidgetsState } from '../../../store/slices/widgets';
import { resetTodosState } from '../../../store/slices/todos';
import { wipeApp } from '../../../store/utils/settings';
import { getStore, getWalletStore } from '../../../store/helpers';
import { warningsSelector } from '../../../store/reselect/checks';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import SettingsView from './../SettingsView';
import { EItemType, IListData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { refreshWallet } from '../../../utils/wallet';
import { zipLogs } from '../../../utils/lightning/logs';
import { runChecks } from '../../../utils/wallet/checks';
import { showToast } from '../../../utils/notifications';
import { getFakeTransaction } from '../../../utils/wallet/testing';
import Dialog from '../../../components/Dialog';
import { resetBackupState } from '../../../store/slices/backup';
import { updateUi } from '../../../store/slices/ui';

const DevSettings = ({
	navigation,
}: SettingsScreenProps<'DevSettings'>): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('lightning');
	const [showDialog, setShowDialog] = useState(false);
	// const [throwError, setThrowError] = useState(false);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const addressType = useAppSelector(addressTypeSelector);
	const isProfiling = useAppSelector((state) => state.ui.isProfiling);
	const warnings = useAppSelector((state) => {
		return warningsSelector(state, selectedWallet, selectedNetwork);
	});

	const exportLdkLogs = async (): Promise<void> => {
		const result = await zipLogs({
			includeJson: true,
			includeBinaries: true,
		});
		if (result.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_logs'),
				description: t('error_logs_description'),
			});
			return;
		}

		// Share the zip file
		await Share.open({
			type: 'application/zip',
			url: `file://${result.value}`,
			title: t('export_logs'),
		});

		setShowDialog(false);
	};

	const exportStore = async (): Promise<void> => {
		const time = new Date().getTime();
		const store = JSON.stringify(getStore(), null, 2);
		const filePath = `${RNFS.DocumentDirectoryPath}/bitkit_store_${time}.json`;

		try {
			// Create temp file in app storage
			await writeFile(filePath, store, 'utf8');

			// Export file
			await Share.open({
				title: 'Export Bitkit Store',
				type: 'application/json',
				url: `file://${filePath}`,
			});

			// Delete file from app storage
			await unlink(filePath);
		} catch (error) {
			console.log(error);
		}
	};

	const settingsListData: IListData[] = [
		{
			data: [
				{
					title: 'Fee Settings',
					type: EItemType.button,
					testID: 'FeeSettings',
					onPress: (): void => {
						navigation.navigate('FeeSettings');
					},
				},
				{
					title: 'Ledger',
					type: EItemType.button,
					testID: 'FeeSettings',
					onPress: (): void => {
						navigation.navigate('Ledger');
					},
				},
			],
		},
		{
			title: 'Debug',
			data: [
				{
					title: isProfiling ? 'Stop Profiler' : 'Start Profiler',
					type: EItemType.button,
					value: isProfiling,
					loading: isProfiling,
					onPress: async (): Promise<void> => {
						if (isProfiling) {
							const path = await stopProfiling(true);
							dispatch(updateUi({ isProfiling: false }));
							console.log('profile file: ', path);
						} else {
							dispatch(updateUi({ isProfiling: true }));
							startProfiling();
						}
					},
				},
				{
					title: 'Inject Fake Transaction',
					type: EItemType.button,
					testID: 'InjectFakeTransaction',
					onPress: (): void => {
						const id =
							'9c0bed5b4c0833824210d29c3c847f47132c03f231ef8df228862132b3a8d80a';
						const fakeTx = getFakeTransaction(id);
						fakeTx[id].height = 0;
						injectFakeTransaction({
							selectedWallet,
							selectedNetwork,
							fakeTx,
						});
						refreshWallet({ selectedWallet, selectedNetwork }).then();
					},
				},
				// {
				// 	title: 'Trigger exception in React render',
				// 	type: EItemType.button,
				// 	testID: 'TriggerRenderError',
				// 	onPress: (): void => {
				// 		setThrowError(true);
				// 	},
				// },
				{
					title: 'Trigger exception in action handler',
					type: EItemType.button,
					testID: 'TriggerActionError',
					onPress: (): void => {
						throw new Error('test action error');
					},
				},
				{
					title: 'Trigger unhandled async exception',
					type: EItemType.button,
					testID: 'TriggerAsyncError',
					onPress: (): void => {
						throw new Error('test async error');
					},
				},
				{
					title: 'Trigger Storage Warning',
					type: EItemType.button,
					hide: selectedNetwork !== 'bitcoinRegtest',
					testID: 'TriggerStorageWarning',
					onPress: (): void => {
						const wallet = getWalletStore();
						const addresses =
							wallet.wallets[selectedWallet].addresses[selectedNetwork][
								addressType
							];
						Object.keys(addresses).map((key) => {
							if (addresses[key].index === 0) {
								addresses[key].address =
									'bcrt1qjp22nm804mtl6vtzf65z2jgmeaedrlvzlxffjv';
							}
						});
						const changeAddresses =
							wallet.wallets[selectedWallet].changeAddresses[selectedNetwork][
								addressType
							];
						Object.keys(changeAddresses).map((key) => {
							if (changeAddresses[key].index === 0) {
								changeAddresses[key].address =
									'bcrt1qwxfllzxchc9eq95zrcc9cjxhzqpkgtznc4wpzc';
							}
						});
						updateWallet(wallet);
						runChecks({ selectedWallet, selectedNetwork }).then();
					},
				},
			],
		},
		{
			title: 'Wallet Checks',
			data: [
				{
					title: `Warnings: ${warnings.length}`,
					type: EItemType.textButton,
					value: '',
					testID: 'Warnings',
				},
			],
		},
		{
			title: 'App Cache',
			data: [
				{
					title: 'Clear AsyncStorage',
					type: EItemType.button,
					onPress: AsyncStorage.clear,
				},
				{
					title: "Clear UTXO's",
					type: EItemType.button,
					onPress: clearUtxos,
				},
				{
					title: 'Export LDK Logs',
					type: EItemType.button,
					onPress: () => setShowDialog(true),
				},
				{
					title: 'Export Store',
					type: EItemType.button,
					onPress: exportStore,
				},
				{
					title: 'Reset App State',
					type: EItemType.button,
					onPress: (): void => {
						dispatch({ type: actions.WIPE_APP });
					},
				},
				{
					title: 'Reset Activity State',
					type: EItemType.button,
					onPress: () => dispatch(resetActivityState()),
				},
				{
					title: 'Reset Backup State',
					type: EItemType.button,
					onPress: () => dispatch(resetBackupState()),
				},
				{
					title: 'Reset Blocktank State',
					type: EItemType.button,
					onPress: () => dispatch(resetBlocktankState()),
				},
				{
					title: 'Reset Current Wallet State',
					type: EItemType.button,
					onPress: async (): Promise<void> => {
						await resetSelectedWallet({ selectedWallet });
					},
				},
				{
					title: 'Reset Fees State',
					type: EItemType.button,
					onPress: () => dispatch(resetFeesState()),
				},
				{
					title: 'Reset Lightning State',
					type: EItemType.button,
					onPress: () => dispatch(resetLightningState()),
				},
				{
					title: 'Reset Metadata State',
					type: EItemType.button,
					onPress: () => dispatch(resetMetadataState()),
				},
				{
					title: 'Reset Settings State',
					type: EItemType.button,
					onPress: () => dispatch(resetSettingsState()),
				},
				{
					title: 'Reset Slashtags State',
					type: EItemType.button,
					onPress: () => dispatch(resetSlashtagsState()),
				},
				{
					title: 'Reset Todos State',
					type: EItemType.button,
					onPress: () => dispatch(resetTodosState()),
				},
				{
					title: 'Reset User State',
					type: EItemType.button,
					onPress: () => dispatch(resetUserState()),
				},
				{
					title: 'Reset Widgets State',
					type: EItemType.button,
					onPress: () => dispatch(resetWidgetsState()),
				},
				{
					title: 'Wipe App',
					type: EItemType.button,
					onPress: wipeApp,
				},
			],
		},
	];

	// if (throwError) {
	// 	throw new Error('test render error');
	// }

	return (
		<>
			<SettingsView title="Dev Settings" listData={settingsListData} />
			<Dialog
				visible={showDialog}
				title="Export sensitive logs?"
				description="This export contains sensitive data and gives control over your Lightning funds. Do you want to continue?"
				cancelText="Cancel"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={exportLdkLogs}
			/>
		</>
	);
};

export default memo(DevSettings);
