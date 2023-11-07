import React, { ReactElement, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import RNExitApp from 'react-native-exit-app';
import { useSelector } from 'react-redux';

import lm, { ldk, TLdkData } from '@synonymdev/react-native-ldk';
import { View as ThemedView } from '../../styles/components';
import List, { EItemType, IListData, ItemData } from '../../components/List';
import { Text01S } from '../../styles/text';

import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { RecoveryStackScreenProps } from '../../navigation/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { SlashtagsProvider } from '../../components/SlashtagsProvider';
import { SlashtagsProvider2 } from '../../components/SlashtagsProvider2';
import {
	EBackupCategories,
	fetchBackup,
	listBackups,
} from '../../utils/backup/backpack';
import { EAvailableNetworks } from '../../utils/networks';
import Dialog from '../../components/Dialog';
import { startWalletServices } from '../../utils/startup';
import { showToast } from '../../utils/notifications';
import { selectedNetworkSelector } from '../../store/reselect/wallet';
import { bytesToString } from '../../utils/converters';
import { setLdkStoragePath } from '../../utils/lightning';
import { TAccountBackup } from '../../store/types/backup';

const Lightning = (
	props: RecoveryStackScreenProps<'Lightning'>,
): ReactElement => {
	return (
		<SlashtagsProvider>
			<SlashtagsProvider2>
				<LightningWithSlashtags {...props} />
			</SlashtagsProvider2>
		</SlashtagsProvider>
	);
};

const LightningWithSlashtags = ({
	navigation,
}: RecoveryStackScreenProps<'Lightning'>): ReactElement => {
	const { t } = useTranslation('security');
	const slashtag = useSelectedSlashtag();
	const [history, setHistory] = useState<IListData>({
		title: 'Loading backups...',
		data: [],
	});
	const [showConfirmRecoveryDialog, setShowConfirmRecoveryDialog] =
		useState(false);
	const [isFetchingBackup, setIsFetchingBackup] = useState(false);
	const [backup, setBackup] = useState<TAccountBackup<TLdkData> | null>(null);
	const [isRecoveringChannels, setIsRecoveringChannels] = useState(false);
	const [recoveredSats, setRecoveredSats] = useState(0);
	const [showLdkRecoverySuccessDialog, setShowLdkRecoverySuccessDialog] =
		useState(false);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	//On mount
	useEffect(() => {
		if (!slashtag || history.data.length > 0) {
			return;
		}

		const listLdkBackups = async (): Promise<void> => {
			const res = await listBackups(
				slashtag.slashtag,
				EBackupCategories.ldkComplete,
				__DEV__ ? selectedNetwork : EAvailableNetworks.bitcoin,
			);

			if (res.isErr()) {
				console.error(res.error);
				showToast({
					type: 'error',
					title: t('lightning_recovery_error'),
					description: res.error.message,
				});
				return;
			}

			const data: ItemData[] = res.value.map(({ timestamp }) => {
				return {
					title: `${new Date(timestamp).toLocaleString()}`,
					enabled: true,
					type: EItemType.button,
					onPress: async (): Promise<void> =>
						confirmRestoreFromBackup(timestamp),
				};
			});

			setHistory({
				data: data,
			});
		};

		listLdkBackups().catch((e) => console.log(e));
	});

	const onBack = (): void => {
		console.warn(JSON.stringify(navigation));
		navigation.goBack();
	};

	const confirmRestoreFromBackup = async (timestamp: number): Promise<void> => {
		if (isFetchingBackup) {
			return;
		}

		setIsFetchingBackup(true);
		const res = await fetchBackup(
			slashtag.slashtag,
			timestamp,
			EBackupCategories.ldkComplete,
			selectedNetwork,
		);

		if (res.isErr()) {
			console.log(res.error);
			setIsFetchingBackup(false);
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: res.error.message,
			});
			return;
		}

		const jsonString = bytesToString(res.value.content);

		setBackup(JSON.parse(jsonString));
		setIsFetchingBackup(false);
		setShowConfirmRecoveryDialog(true);
	};

	const onShowLdkRecoveryConfirmed = async (): Promise<void> => {
		if (!backup) {
			return;
		}

		if (Object.keys(backup.data.channel_monitors).length === 0) {
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: t('lightning_recovery_no_channels'),
			});
			return;
		}

		setShowConfirmRecoveryDialog(false);
		setIsRecoveringChannels(true);

		await ldk.stop();

		const storageRes = await setLdkStoragePath();
		if (storageRes.isErr()) {
			console.error(storageRes.error);
			setIsRecoveringChannels(false);
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: storageRes.error.message,
			});
			return;
		}

		const importRes = await lm.importAccount({
			backup,
		});
		if (importRes.isErr()) {
			console.error(importRes.error);
			setIsRecoveringChannels(false);
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: importRes.error.message,
			});
			return;
		}

		const setupRes = await startWalletServices({
			onchain: false,
			lightning: true,
			restore: false,
			staleBackupRecoveryMode: true,
		});

		if (setupRes.isErr()) {
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: setupRes.error.message,
			});
			setIsRecoveringChannels(false);
			return;
		}

		const balances = await ldk.claimableBalances(false);
		if (balances.isErr()) {
			showToast({
				type: 'error',
				title: t('lightning_recovery_error'),
				description: balances.error.message,
			});
			setIsRecoveringChannels(false);
			return;
		}

		await ldk.stop();

		let sats = 0;
		balances.value.forEach((balance) => {
			sats += balance.amount_satoshis;
		});

		setRecoveredSats(sats);
		setShowLdkRecoverySuccessDialog(true);
		setIsRecoveringChannels(false);
	};

	const onCloseApp = (): void => {
		RNExitApp.exitApp();
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('lightning_recovery_title')} />
			<View style={styles.content}>
				{isRecoveringChannels ? (
					<ActivityIndicator color="white" />
				) : (
					<>
						{history.data.length === 0 ? (
							<Text01S>No backups found.</Text01S>
						) : (
							<List data={[history]} />
						)}
					</>
				)}
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('back')}
						size="large"
						onPress={onBack}
					/>
				</View>
			</View>
			<Dialog
				visible={showConfirmRecoveryDialog}
				title={t('lightning_recovery_title')}
				description={t('lightning_recovery_desc', {
					channelCount: backup
						? Object.keys(backup.data.channel_monitors).length
						: 0,
				})}
				onCancel={(): void => setShowConfirmRecoveryDialog(false)}
				onConfirm={onShowLdkRecoveryConfirmed}
			/>
			<Dialog
				visible={showLdkRecoverySuccessDialog}
				title={t('lightning_recovery_success')}
				description={t('lightning_recovery_success_message', {
					sats: recoveredSats,
				})}
				confirmText={t('close_app')}
				onConfirm={onCloseApp}
			/>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default Lightning;
