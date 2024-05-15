import React, { ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';
import RNExitApp from 'react-native-exit-app';

import { wipeApp } from '../../store/utils/settings';
import { openURL } from '../../utils/helpers';
import { zipLogs } from '../../utils/lightning/logs';
import { createSupportLink } from '../../utils/support';
import { showToast } from '../../utils/notifications';
import { View as ThemedView } from '../../styles/components';
import { BodyM } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import { RecoveryStackScreenProps } from '../../navigation/types';
import { walletExistsSelector } from '../../store/reselect/wallet';
import { pinSelector } from '../../store/reselect/settings';

const Recovery = ({
	navigation,
}: RecoveryStackScreenProps<'Recovery'>): ReactElement => {
	const { t } = useTranslation('security');
	const pin = useAppSelector(pinSelector);
	const walletExists = useAppSelector(walletExistsSelector);
	const [locked, setLocked] = useState(true);
	const [showWipeDialog, setShowWipeDialog] = useState(false);

	useEffect(() => {
		// avoid accidentally pressing a button
		setTimeout(() => setLocked(false), 1000);
	}, []);

	const onExportLogs = async (): Promise<void> => {
		const result = await zipLogs({ limit: 20, allAccounts: true });
		if (result.isErr()) {
			showToast({
				type: 'warning',
				title: t('lightning:error_logs'),
				description: t('lightning:error_logs_description'),
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

	const onContactSupport = async (): Promise<void> => {
		const link = await createSupportLink();
		const res = await openURL(link);
		if (!res) {
			await openURL('https://synonym.to/contact');
		}
	};

	const onWipeApp = (): void => {
		if (pin) {
			navigation.navigate('AuthCheck', {
				onSuccess: () => {
					// hack needed for Android
					setTimeout(() => {
						setShowWipeDialog(true);
						navigation.pop();
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

	const onCloseApp = (): void => {
		RNExitApp.exitApp();
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('recovery')} displayBackButton={false} />
			<View style={styles.content}>
				<BodyM color="white50">{t('recovery_text')}</BodyM>

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
