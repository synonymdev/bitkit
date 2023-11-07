import React, { memo, ReactElement, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import RNFS, { unlink, writeFile } from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';

import { __DISABLE_SLASHTAGS__ } from '../../../constants/env';
import actions from '../../../store/actions/actions';
import {
	clearUtxos,
	injectFakeTransaction,
	resetSelectedWallet,
	updateWallet,
} from '../../../store/actions/wallet';
import { resetUserStore } from '../../../store/actions/user';
import { resetActivityStore } from '../../../store/actions/activity';
import {
	resetLightningStore,
	updateLdkAccountVersion,
	updateLightningNodeId,
} from '../../../store/actions/lightning';
import { resetBlocktankStore } from '../../../store/actions/blocktank';
import { resetSlashtagsStore } from '../../../store/actions/slashtags';
import { resetWidgetsStore } from '../../../store/actions/widgets';
import { resetFeesStore } from '../../../store/actions/fees';
import { resetTodos } from '../../../store/actions/todos';
import { resetSettingsStore, wipeApp } from '../../../store/actions/settings';
import { getStore, getWalletStore } from '../../../store/helpers';
import { warningsSelector } from '../../../store/reselect/checks';
import {
	addressTypeSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { resetMetaStore } from '../../../store/actions/metadata';
import SettingsView from './../SettingsView';
import { EItemType, IListData } from '../../../components/List';
import { refreshWallet } from '../../../utils/wallet';
import { runChecks } from '../../../utils/wallet/checks';
import { getFakeTransaction } from '../../../utils/wallet/testing';
import type { SettingsScreenProps } from '../../../navigation/types';
import { lightningSelector } from '../../../store/reselect/lightning';
import {
	createDefaultLdkAccount,
	getNodeId,
	setupLdk,
} from '../../../utils/lightning';

const DevSettings = ({
	navigation,
}: SettingsScreenProps<'DevSettings'>): ReactElement => {
	const dispatch = useDispatch();
	const [throwError, setThrowError] = useState(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const addressType = useSelector(addressTypeSelector);
	const lightning = useSelector(lightningSelector);
	const warnings = useSelector((state) => {
		return warningsSelector(state, selectedWallet, selectedNetwork);
	});

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
					title: 'Slashtags Settings',
					type: EItemType.button,
					enabled: !__DISABLE_SLASHTAGS__,
					testID: 'SlashtagsSettings',
					onPress: (): void => {
						navigation.navigate('SlashtagsSettings');
					},
				},
				{
					title: 'Fee Settings',
					type: EItemType.button,
					testID: 'FeeSettings',
					onPress: (): void => {
						navigation.navigate('FeeSettings');
					},
				},
			],
		},
		{
			title: 'Debug',
			data: [
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
						updateWallet(wallet);
						runChecks({ selectedWallet, selectedNetwork }).then();
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
			title: 'LDK Account Migration',
			data: [
				{
					title: `LDK Account Version: ${lightning.accountVersion}`,
					type: EItemType.textButton,
					value: '',
					testID: 'LDKAccountVersion',
				},
				{
					title: 'Force LDK V2 Account Migration',
					type: EItemType.button,
					onPress: async (): Promise<void> => {
						updateLdkAccountVersion(2);
						await createDefaultLdkAccount({
							version: 2,
							selectedWallet,
							selectedNetwork,
						});
						await setupLdk({
							selectedWallet,
							selectedNetwork,
							shouldRefreshLdk: true,
						});
						const newNodeId = await getNodeId();
						if (newNodeId.isOk()) {
							updateLightningNodeId({
								nodeId: newNodeId.value,
								selectedWallet,
								selectedNetwork,
							});
						}
					},
					testID: 'ForceV2Migration',
				},
				{
					title: 'Revert to LDK V1 Account',
					type: EItemType.button,
					onPress: async (): Promise<void> => {
						updateLdkAccountVersion(1);
						await createDefaultLdkAccount({
							version: 1,
							selectedWallet,
							selectedNetwork,
						});
						await setupLdk({
							selectedWallet,
							selectedNetwork,
							shouldRefreshLdk: true,
						});
						const newNodeId = await getNodeId();
						if (newNodeId.isOk()) {
							updateLightningNodeId({
								nodeId: newNodeId.value,
								selectedWallet,
								selectedNetwork,
							});
						}
					},
					testID: 'RevertToLDKV1',
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
					title: 'Export Store',
					type: EItemType.button,
					onPress: exportStore,
				},
				{
					title: 'Reset All Stores',
					type: EItemType.button,
					onPress: (): void => {
						dispatch({ type: actions.WIPE_APP });
					},
				},
				{
					title: 'Reset Activity Store',
					type: EItemType.button,
					onPress: resetActivityStore,
				},
				{
					title: 'Reset Blocktank Store',
					type: EItemType.button,
					onPress: resetBlocktankStore,
				},
				{
					title: 'Reset Current Wallet Store',
					type: EItemType.button,
					onPress: async (): Promise<void> => {
						await resetSelectedWallet({ selectedWallet });
					},
				},
				{
					title: 'Reset Fees Store',
					type: EItemType.button,
					onPress: resetFeesStore,
				},
				{
					title: 'Reset Lightning Store',
					type: EItemType.button,
					onPress: resetLightningStore,
				},
				{
					title: 'Reset Metadata Store',
					type: EItemType.button,
					onPress: resetMetaStore,
				},
				{
					title: 'Reset Settings Store',
					type: EItemType.button,
					onPress: resetSettingsStore,
				},
				{
					title: 'Reset Slashtags Store',
					type: EItemType.button,
					onPress: resetSlashtagsStore,
				},
				{
					title: 'Reset Todos Store',
					type: EItemType.button,
					onPress: resetTodos,
				},
				{
					title: 'Reset User Store',
					type: EItemType.button,
					onPress: resetUserStore,
				},
				{
					title: 'Reset Widgets Store',
					type: EItemType.button,
					onPress: resetWidgetsStore,
				},
				{
					title: 'Wipe App',
					type: EItemType.button,
					onPress: wipeApp,
				},
			],
		},
	];

	if (throwError) {
		throw new Error('test render error');
	}

	return (
		<SettingsView
			title="Dev Settings"
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(DevSettings);
