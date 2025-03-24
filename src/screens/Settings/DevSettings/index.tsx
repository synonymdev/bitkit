import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RNFS, { unlink, writeFile } from 'react-native-fs';
import Share from 'react-native-share';

import Dialog from '../../../components/Dialog';
import { EItemType, IListData } from '../../../components/List';
import { __E2E__ } from '../../../constants/env';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';
import { widgetsCache } from '../../../storage';
import { storage } from '../../../storage';
import actions from '../../../store/actions/actions';
import {
	clearUtxos,
	injectFakeTransaction,
} from '../../../store/actions/wallet';
import { getStore, getWalletStore } from '../../../store/helpers';
import { warningsSelector } from '../../../store/reselect/checks';
import { settingsSelector } from '../../../store/reselect/settings';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { resetActivityState } from '../../../store/slices/activity';
import { resetBackupState } from '../../../store/slices/backup';
import { resetBlocktankState } from '../../../store/slices/blocktank';
import { resetFeesState } from '../../../store/slices/fees';
import { resetLightningState } from '../../../store/slices/lightning';
import { resetMetadataState } from '../../../store/slices/metadata';
import {
	resetSettingsState,
	updateSettings,
} from '../../../store/slices/settings';
import { resetSlashtagsState } from '../../../store/slices/slashtags';
import { resetTodosState } from '../../../store/slices/todos';
import { resetUserState } from '../../../store/slices/user';
import {
	resetSelectedWallet,
	updateWallet,
} from '../../../store/slices/wallet';
import { resetWidgetsState } from '../../../store/slices/widgets';
import { wipeApp } from '../../../store/utils/settings';
import { zipLogs } from '../../../utils/lightning/logs';
import { showToast } from '../../../utils/notifications';
import { refreshWallet } from '../../../utils/wallet';
import { runChecks } from '../../../utils/wallet/checks';
import { getFakeTransaction } from '../../../utils/wallet/testing';
import SettingsView from './../SettingsView';

const DevSettings = ({
	navigation,
}: SettingsScreenProps<'DevSettings'>): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('lightning');
	const [showDialog, setShowDialog] = useState(false);
	const [throwError, setThrowError] = useState(false);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const addressType = useAppSelector(addressTypeSelector);
	const warnings = useAppSelector(warningsSelector);
	const { rbf } = useAppSelector(settingsSelector);

	const clearWebRelayCache = (): void => {
		const keys = storage.getAllKeys();
		keys.forEach((key) => {
			if (key.includes('WEB-RELAY-CLIENT')) {
				storage.delete(key);
			}
		});
	};

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
					title: t('RBF'),
					type: EItemType.switch,
					testID: 'RBF',
					enabled: rbf,
					onPress: (): void => {
						dispatch(updateSettings({ rbf: !rbf }));
					},
				},
			],
		},
		{
			title: 'Debug',
			data: [
				{
					title: 'LDK',
					type: EItemType.button,
					testID: 'LDKDebug',
					onPress: (): void => {
						navigation.navigate('LdkDebug');
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
					title: 'Clear WebRelay Cache',
					type: EItemType.button,
					onPress: clearWebRelayCache,
				},
				{
					title: 'Clear Widgets Cache',
					type: EItemType.button,
					onPress: widgetsCache.clear,
				},
				{
					title: 'Clear UTXOs',
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
						dispatch(resetSelectedWallet());
						await refreshWallet();
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

	// add only in dev or e2e mode
	if (__DEV__ || __E2E__) {
		settingsListData[1].data = [
			...settingsListData[1].data,
			{
				title: 'Inject Fake Transaction',
				type: EItemType.button,
				testID: 'InjectFakeTransaction',
				onPress: (): void => {
					const id =
						'9c0bed5b4c0833824210d29c3c847f47132c03f231ef8df228862132b3a8d80a';
					const fakeTx = getFakeTransaction(id);
					fakeTx[id].height = 0;
					injectFakeTransaction(fakeTx);
					refreshWallet().then();
				},
			},
			{
				title: 'Trigger exception in React render',
				type: EItemType.button,
				testID: 'TriggerRenderError',
				onPress: (): void => {
					setThrowError(true);
				},
			},
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
					dispatch(updateWallet(wallet));
					runChecks({ selectedWallet, selectedNetwork }).then();
				},
			},
		];
	}

	if (throwError) {
		throw new Error('test render error');
	}

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
