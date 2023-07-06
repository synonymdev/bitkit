import React, { ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';
import RNExitApp from 'react-native-exit-app';
import { ldk } from '@synonymdev/react-native-ldk';

import { wipeApp } from '../../store/actions/settings';
import { openURL } from '../../utils/helpers';
import { zipLogs } from '../../utils/lightning/logs';
import { createSupportLink } from '../../utils/support';
import { showToast } from '../../utils/notifications';
import { View as ThemedView } from '../../styles/components';
import { Text01S } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import { RecoveryStackScreenProps } from '../../navigation/types';
import { walletExistsSelector } from '../../store/reselect/wallet';
import { pinSelector } from '../../store/reselect/settings';
import { startWalletServices } from '../../utils/startup';

const Recovery = ({
	navigation,
}: RecoveryStackScreenProps<'Recovery'>): ReactElement => {
	const { t } = useTranslation('security');
	const pin = useSelector(pinSelector);
	const walletExists = useSelector(walletExistsSelector);
	const [locked, setLocked] = useState(true);
	const [showWipeDialog, setShowWipeDialog] = useState(false);
	const [showLdkRecoveryDialog, setShowLdkRecoveryDialog] = useState(false);
	const [showLdkRecoverySuccessDialog, setShowLdkRecoverySuccessDialog] =
		useState(false);
	const [recoveredSats, setRecoveredSats] = useState(0);
	const [isRecoveringChannels, setIsRecoveringChannels] = useState(false);

	useEffect(() => {
		// avoid accidentally pressing a button
		setTimeout(() => setLocked(false), 1000);
	}, []);

	const onExportLogs = async (): Promise<void> => {
		const result = await zipLogs({ limit: 20, allAccounts: true });
		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('lightning:error_logs'),
				description: result.error.message,
			});
			return;
		}

		await Share.open({
			type: 'application/zip',
			url: `file://${result.value}`,
			title: t('lightning:export_logs'),
		});
	};

	const onShowSeed = async (): Promise<void> => {
		if (pin) {
			navigation.navigate('AuthCheck', {
				onSuccess: () => {
					// hack needed for Android
					setTimeout(() => {
						navigation.replace('Mnemonic');
					}, 100);
				},
			});
		} else {
			navigation.navigate('Mnemonic');
		}
	};

	const onShowLdkRecovery = async (): Promise<void> => {
		if (pin) {
			navigation.navigate('AuthCheck', {
				onSuccess: () => {
					// hack needed for Android
					setTimeout(() => {
						setShowLdkRecoveryDialog(true);
					}, 100);
				},
			});
		} else {
			setShowLdkRecoveryDialog(true);
		}
	};

	const onContactSupport = async (): Promise<void> => {
		const link = await createSupportLink();
		await openURL(link);
	};

	const onWipeApp = (): void => {
		if (pin) {
			navigation.navigate('AuthCheck', {
				onSuccess: () => {
					// hack needed for Android
					setTimeout(() => {
						setShowWipeDialog(true);
					}, 100);
				},
			});
		} else {
			setShowWipeDialog(true);
		}
	};

	const onWipeAppConfirmed = async (): Promise<void> => {
		await wipeApp();
		setShowWipeDialog(false);
	};

	const onShowLdkRecoveryConfirmed = async (): Promise<void> => {
		setShowLdkRecoveryDialog(false);
		setIsRecoveringChannels(true);

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
			sats += balance.claimable_amount_satoshis;
		});
		setRecoveredSats(sats);
		setShowLdkRecoverySuccessDialog(true);
		setIsRecoveringChannels(false);

		return;
	};

	const onCloseApp = (): void => {
		RNExitApp.exitApp();
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('recovery')} displayBackButton={false} />
			<View style={styles.content}>
				<Text01S color="gray1">{t('recovery_text')}</Text01S>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('lightning:export_logs')}
						size="large"
						variant="secondary"
						disabled={locked}
						onPress={onExportLogs}
					/>
					<Button
						style={styles.button}
						text={t('display_seed')}
						size="large"
						variant="secondary"
						disabled={locked || !walletExists}
						onPress={onShowSeed}
					/>
					<Button
						style={styles.button}
						text={t('lightning_recovery_title')}
						loading={isRecoveringChannels}
						size="large"
						variant="secondary"
						disabled={locked || !walletExists}
						onPress={onShowLdkRecovery}
					/>
					<Button
						style={styles.button}
						text={t('contact_support')}
						size="large"
						variant="secondary"
						disabled={locked}
						onPress={onContactSupport}
					/>
					<Button
						style={styles.button}
						text={t('wipe_app')}
						size="large"
						variant="secondary"
						disabled={locked}
						onPress={onWipeApp}
					/>
				</View>

				<View style={styles.footer}>
					<Button
						text={t('close_app')}
						size="large"
						disabled={locked}
						onPress={onCloseApp}
					/>
				</View>
			</View>

			<Dialog
				visible={showWipeDialog}
				title={t('reset_dialog_title')}
				description={t('reset_dialog_desc')}
				onCancel={(): void => setShowWipeDialog(false)}
				onConfirm={onWipeAppConfirmed}
			/>

			<Dialog
				visible={showLdkRecoveryDialog}
				title={t('lightning_recovery_title')}
				description={t('lightning_recovery_desc')}
				onCancel={(): void => setShowLdkRecoveryDialog(false)}
				onConfirm={onShowLdkRecoveryConfirmed}
			/>

			<Dialog
				visible={showLdkRecoverySuccessDialog}
				title={t('lightning_recovery_success')}
				description={t('lightning_recovery_success_message', {
					sats: recoveredSats,
				})}
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
	buttons: {
		marginTop: 32,
	},
	button: {
		marginBottom: 16,
	},
	footer: {
		marginTop: 'auto',
	},
});

export default Recovery;
