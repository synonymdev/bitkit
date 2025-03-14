import Clipboard from '@react-native-clipboard/clipboard';
import lm from '@synonymdev/react-native-ldk';
import React, { ReactElement, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useLightningBalance } from '../../../hooks/lightning';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { openChannelsSelector } from '../../../store/reselect/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { removeLightningPeer } from '../../../store/slices/lightning';
import {
	createLightningInvoice,
	savePeer,
} from '../../../store/utils/lightning';
import { TextInput, View as ThemedView } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import {
	addPeer,
	getNodeId,
	payLightningInvoice,
	rebroadcastAllKnownTransactions,
	recoverOutputs,
	recoverOutputsFromForceClose,
	refreshLdk,
	removeUnusedPeers,
	setupLdk,
} from '../../../utils/lightning';
import { zipLogs } from '../../../utils/lightning/logs';
import { showToast } from '../../../utils/notifications';

const LdkDebug = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();
	const sheetRef = useSheetRef('forceTransfer');
	const [peer, setPeer] = useState('');
	const [payingInvoice, setPayingInvoice] = useState(false);
	const [refreshingLdk, setRefreshingLdk] = useState(false);
	const [restartingLdk, setRestartingLdk] = useState(false);
	const [rebroadcastingLdk, setRebroadcastingLdk] = useState(false);
	const [spendingStuckOutputs, setSpendingStuckOutputs] = useState(false);

	const { localBalance, remoteBalance } = useLightningBalance();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const openChannels = useAppSelector(openChannelsSelector);

	const onNodeId = async (): Promise<void> => {
		const nodeId = await getNodeId();
		if (nodeId.isErr()) {
			console.log(nodeId.error.message);
			return;
		}
		console.log(`Node ID: ${nodeId.value}`);
		Clipboard.setString(nodeId.value);
		showToast({
			type: 'success',
			title: 'Copied Node ID to Clipboard',
			description: nodeId.value,
		});
	};

	const onRefreshLdk = async (): Promise<void> => {
		setRefreshingLdk(true);
		await refreshLdk({ selectedWallet, selectedNetwork });
		setRefreshingLdk(false);
	};

	const onRestartLdk = async (): Promise<void> => {
		setRestartingLdk(true);
		const res = await setupLdk({ selectedWallet, selectedNetwork });
		if (res.isErr()) {
			showToast({
				type: 'error',
				title: t('wallet:ldk_start_error_title'),
				description: res.error.message,
			});
		}
		setRestartingLdk(false);
	};

	const onAddPeer = async (): Promise<void> => {
		if (!peer) {
			// Attempt to grab and set peer string from clipboard.
			const clipboardStr = await Clipboard.getString();
			setPeer(clipboardStr);
			return;
		}
		const addPeerRes = await addPeer({ peer, timeout: 5000 });
		if (addPeerRes.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_add_title'),
				description: addPeerRes.error.message,
			});
			return;
		}
		const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
		if (savePeerRes.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_save_title'),
				description: savePeerRes.error.message,
			});
			return;
		}
		showToast({
			type: 'success',
			title: savePeerRes.value,
			description: t('peer_saved'),
		});
	};

	const onListPeers = async (): Promise<void> => {
		const peers = await lm.getPeers();
		console.log({ peers });
	};

	const onDisconnectPeers = async (): Promise<void> => {
		const peers = await lm.getPeers();

		const promises = peers.map(({ pubKey, address, port }) => {
			const peerStr = `${pubKey}@${address}:${port}`;
			// Remove peer from local storage
			dispatch(
				removeLightningPeer({
					peer: peerStr,
					selectedWallet,
					selectedNetwork,
				}),
			);
			// Instruct LDK to disconnect from peer
			return lm.removePeer({ pubKey, address, port, timeout: 5000 });
		});

		const results = await Promise.all(promises);
		for (const result of results) {
			if (result.isOk()) {
				console.log('Disconnected from peer.');
			} else {
				console.error(`Failed to disconnect: ${result.error.message}`);
			}
		}
	};

	const onRemoveUnusedPeers = async (): Promise<void> => {
		const res = await removeUnusedPeers({ selectedWallet, selectedNetwork });
		if (res.isErr()) {
			showToast({
				type: 'warning',
				title: 'No unused peers removed',
				description: res.error.message,
			});
		} else {
			showToast({
				type: 'info',
				title: 'Removed unused peers',
				description: res.value,
			});
		}
	};

	const onExportLogs = async (): Promise<void> => {
		const result = await zipLogs();
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
	};

	const onSaveLogs = async (): Promise<void> => {
		const result = await zipLogs();
		if (result.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_logs'),
				description: t('error_logs_description'),
			});
			return;
		}

		// Define the destination path in the Downloads folder
		const downloadsDir = RNFS.DownloadDirectoryPath;
		const destinationPath = `${downloadsDir}/bitkit_ldk_logs.zip`;

		await RNFS.copyFile(result.value, destinationPath);

		showToast({
			type: 'success',
			title: 'Logs saved', // todo: locale
			description: `${destinationPath}`,
		});
	};

	const onCreateInvoice = async (amountSats = 100): Promise<void> => {
		const createPaymentRequest = await createLightningInvoice({
			amountSats,
			description: '',
			expiryDeltaSeconds: 99999,
			selectedNetwork,
			selectedWallet,
		});
		if (createPaymentRequest.isErr()) {
			showToast({
				type: 'warning',
				title: t('error_invoice'),
				description: createPaymentRequest.error.message,
			});
			return;
		}
		const { to_str } = createPaymentRequest.value;
		console.log(to_str);
		Clipboard.setString(to_str);
		showToast({
			type: 'success',
			title: t('invoice_copied'),
			description: to_str,
		});
	};

	const onRebroadcastLdkTxs = async (): Promise<void> => {
		setRebroadcastingLdk(true);
		await rebroadcastAllKnownTransactions();
		setRebroadcastingLdk(false);
	};

	const onSpendStuckOutputs = async (): Promise<void> => {
		setSpendingStuckOutputs(true);
		const res = await recoverOutputs();
		if (res.isOk()) {
			showToast({
				type: 'info',
				title: 'Stuck outputs recovered',
				description: res.value,
			});
		} else {
			showToast({
				type: 'warning',
				title: 'No stuck outputs recovered',
				description: res.error.message,
			});
		}
		setSpendingStuckOutputs(false);
	};

	const onForceCloseChannels = (): void => {
		sheetRef.current?.present();
	};

	const onSpendOutputsFromForceClose = async (): Promise<void> => {
		setSpendingStuckOutputs(true);
		const res = await recoverOutputsFromForceClose();
		if (res.isOk()) {
			showToast({
				type: 'info',
				title: 'Completed',
				description: res.value,
			});
		} else {
			showToast({
				type: 'warning',
				title: 'No stuck outputs recovered',
				description: res.error.message,
			});
		}
		setSpendingStuckOutputs(false);
	};

	const onPayInvoiceFromClipboard = async (): Promise<void> => {
		setPayingInvoice(true);
		const invoice = await Clipboard.getString();
		if (!invoice) {
			showToast({
				type: 'warning',
				title: 'No Invoice Detected',
				description: 'Unable to retrieve anything from the clipboard.',
			});
			setPayingInvoice(false);
			return;
		}
		const response = await payLightningInvoice({ invoice });
		if (response.isErr()) {
			showToast({
				type: 'warning',
				title: 'Invoice Payment Failed',
				description: response.error.message,
			});
			setPayingInvoice(false);
			return;
		}
		await refreshLdk({ selectedWallet, selectedNetwork });
		setPayingInvoice(false);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title="LDK Debug" />
			<ScrollView contentContainerStyle={styles.content}>
				<Caption13Up color="secondary">Add Peer</Caption13Up>
				<TextInput
					style={styles.textInput}
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect={false}
					autoFocus={false}
					value={peer}
					placeholder="publicKey@ip:port"
					multiline={true}
					blurOnSubmit
					returnKeyType="done"
					testID="AddPeerInput"
					onChangeText={setPeer}
				/>
				<Button
					style={styles.button}
					text={
						peer ? 'Add Lightning Peer' : 'Paste Lightning Peer From Clipboard'
					}
					testID="AddPeerButton"
					onPress={onAddPeer}
				/>

				<Caption13Up style={styles.sectionTitle} color="secondary">
					Debug
				</Caption13Up>
				<Button
					style={styles.button}
					text="Get Node ID"
					testID="CopyNodeId"
					onPress={onNodeId}
				/>
				<Button
					style={styles.button}
					text="Refresh LDK"
					loading={refreshingLdk}
					testID="RefreshLDK"
					onPress={onRefreshLdk}
				/>
				<Button
					style={styles.button}
					text="Restart LDK"
					loading={restartingLdk}
					testID="RestartLDK"
					onPress={onRestartLdk}
				/>
				<Button style={styles.button} text="List Peers" onPress={onListPeers} />
				<Button
					style={styles.button}
					text="Disconnect Peers"
					onPress={onDisconnectPeers}
				/>
				<Button
					style={styles.button}
					text="Remove Unused Peers"
					onPress={onRemoveUnusedPeers}
				/>
				<Button
					style={styles.button}
					text="Rebroadcast LDK Txs"
					loading={rebroadcastingLdk}
					testID="RebroadcastLDKTXS"
					onPress={onRebroadcastLdkTxs}
				/>
				<Button
					style={styles.button}
					text="Spend Stuck Outputs"
					loading={spendingStuckOutputs}
					onPress={onSpendStuckOutputs}
				/>
				<Button
					style={styles.button}
					text="Force Close Channels"
					onPress={onForceCloseChannels}
				/>
				<Button
					style={styles.button}
					text="Spend outputs from force close"
					loading={spendingStuckOutputs}
					onPress={onSpendOutputsFromForceClose}
				/>
				<Button
					style={styles.button}
					text="Export Logs"
					onPress={onExportLogs}
				/>
				<Button
					style={styles.button}
					text="Save Logs"
					onPress={onSaveLogs}
					testID="SaveLogs"
				/>

				{openChannels.length > 0 && (
					<>
						<Button
							style={styles.button}
							text="Create Invoice: 100 sats"
							disabled={remoteBalance < 100}
							onPress={() => onCreateInvoice(100)}
						/>
						<Button
							style={styles.button}
							text="Create Invoice: 5000 sats"
							disabled={remoteBalance < 5000}
							onPress={() => onCreateInvoice(5000)}
						/>
						<Button
							style={styles.button}
							text="Pay Invoice From Clipboard"
							loading={payingInvoice}
							disabled={localBalance <= 0}
							onPress={onPayInvoiceFromClipboard}
						/>
					</>
				)}

				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	sectionTitle: {
		marginTop: 32,
	},
	textInput: {
		width: '100%',
		minHeight: 50,
		borderRadius: 10,
		padding: 10,
		textAlign: 'left',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 'bold',
		fontSize: 16,
		marginTop: 8,
	},
	button: {
		marginTop: 8,
	},
});

export default memo(LdkDebug);
