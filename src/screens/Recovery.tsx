import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Share from 'react-native-share';

import { View as ThemedView } from '../styles/components';
import { Text01M, Text01S, Title } from '../styles/text';
import SafeAreaInsets from '../components/SafeAreaInsets';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import { wipeApp } from '../store/actions/settings';
import { zipLogs } from '../utils/lightning/logs';
import { showErrorNotification } from '../utils/notifications';
import { openURL } from '../utils/helpers';
import { createSupportLink } from '../utils/support';
import { getBip39Passphrase, getMnemonicPhrase } from '../utils/wallet';
import { Word } from './Settings/Backup/ShowMnemonic';

const Recovery = (): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);
	const [seed, setSeed] = useState<string[]>([]);
	const [passphrase, setPassphrase] = useState('');

	const onBack = (): void => setSeed([]);

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
		const mnemoncicResult = await getMnemonicPhrase();
		const bip39Passphrase = await getBip39Passphrase();

		if (mnemoncicResult.isErr()) {
			showErrorNotification({
				title: 'Error Getting Mnemonic',
				message: mnemoncicResult.error.message,
			});
			return;
		}

		setSeed(mnemoncicResult.value.split(' '));
		setPassphrase(bip39Passphrase);
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
			<Title style={styles.header}>Recovery</Title>
			<View style={styles.content}>
				<Text01S style={styles.text} color="gray1">
					You've entered Bitkit's recovery mode by shaking your phone. Choose
					one of the below actions to get debug information for your wallet.
					Restart the app for a normal startup.
				</Text01S>

				{seed.length ? (
					<>
						<ThemedView color="gray324" style={styles.seed}>
							<View style={styles.col}>
								{seed.slice(0, seed.length / 2).map((w, i) => (
									<Word key={i} word={w} number={i + 1} />
								))}
							</View>
							<View style={styles.col}>
								{seed.slice(-seed.length / 2).map((w, i) => (
									<Word key={i} word={w} number={seed.length / 2 + i + 1} />
								))}
							</View>
						</ThemedView>

						{passphrase !== '' && (
							<Text01M style={styles.passphrase}>
								<Text01M color="gray1">Passphrase:</Text01M> {passphrase}
							</Text01M>
						)}

						<Button
							style={styles.button}
							text="Back"
							size="large"
							onPress={onBack}
						/>
					</>
				) : (
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
				)}
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
	header: {
		textAlign: 'center',
		marginTop: 17,
		paddingBottom: 35,
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
	seed: {
		borderRadius: 16,
		paddingTop: 32,
		paddingBottom: 24,
		paddingHorizontal: 16,
		flexDirection: 'row',
		marginBottom: 16,
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	passphrase: {
		marginBottom: 16,
	},
});

export default Recovery;
