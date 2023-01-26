import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Share from 'react-native-share';

import { useAppSelector } from '../../hooks/redux';
import { wipeApp } from '../../store/actions/settings';
import { openURL } from '../../utils/helpers';
import { zipLogs } from '../../utils/lightning/logs';
import { createSupportLink } from '../../utils/support';
import { showErrorNotification } from '../../utils/notifications';
import { View as ThemedView } from '../../styles/components';
import { Text01S } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import { RecoveryStackScreenProps } from '../../navigation/types';

const Recovery = ({
	navigation,
}: RecoveryStackScreenProps<'Recovery'>): ReactElement => {
	const pin = useAppSelector((state) => state.settings.pin);
	const [showDialog, setShowDialog] = useState(false);

	const onExportLogs = async (): Promise<void> => {
		const result = await zipLogs();
		if (result.isErr()) {
			showErrorNotification({
				title: 'Failed to share logs',
				message: result.error.message,
			});
			return;
		}

		// Share the zip file
		await Share.open({
			type: 'application/zip',
			url: `file://${result.value}`,
			title: 'Export Lightning Logs',
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
		await openURL(link);
	};

	const onWipeApp = async (): Promise<void> => {
		await wipeApp({});
		setShowDialog(false);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Recovery" displayBackButton={false} />
			<View style={styles.content}>
				<Text01S style={styles.text} color="gray1">
					You've entered Bitkit's recovery mode by shaking your phone. Choose
					one of the below actions to get debug information for your wallet.
					Restart the app for a normal startup.
				</Text01S>

				<View>
					<Button
						style={styles.button}
						text="Export Lightning Logs"
						size="large"
						onPress={onExportLogs}
					/>
					<Button
						style={styles.button}
						text="Display Seed"
						size="large"
						onPress={onShowSeed}
					/>
					<Button
						style={styles.button}
						text="Contact Support"
						size="large"
						onPress={onContactSupport}
					/>
					<Button
						style={styles.button}
						text="Wipe App"
						size="large"
						onPress={(): void => setShowDialog(true)}
					/>
				</View>
			</View>

			<Dialog
				visible={showDialog}
				title="Reset Bitkit?"
				description="Are you sure you want to reset your Bitkit Wallet? Do you have a backup of your recovery phrase and wallet data?"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={onWipeApp}
			/>

			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingBottom: 16,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginBottom: 16,
	},
	button: {
		marginBottom: 16,
	},
});

export default Recovery;
