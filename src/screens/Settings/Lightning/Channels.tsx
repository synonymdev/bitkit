import React, {
	ReactElement,
	memo,
	useState,
	useMemo,
	useCallback,
} from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import Share from 'react-native-share';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { TChannel } from '@synonymdev/react-native-ldk';

import {
	AnimatedView,
	RefreshControl,
	View as ThemedView,
	TextInput,
} from '../../../styles/components';
import { Caption13Up, Text01M } from '../../../styles/text';
import { ChevronRight, DownArrow, UpArrow } from '../../../styles/icons';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import useColors from '../../../hooks/colors';
import {
	addPeer,
	getNodeId,
	payLightningInvoice,
	rebroadcastAllKnownTransactions,
	refreshLdk,
	setupLdk,
} from '../../../utils/lightning';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import Clipboard from '@react-native-clipboard/clipboard';
import {
	useLightningChannelName,
	useLightningBalance,
} from '../../../hooks/lightning';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import {
	createLightningInvoice,
	savePeer,
} from '../../../store/actions/lightning';
import { ETransactionDefaults } from '../../../store/types/wallet';
import { useBalance } from '../../../hooks/wallet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import {
	channelsSelector,
	closedChannelsSelector,
	openChannelIdsSelector,
	isChannelReadySelector,
	pendingChannelsSelector,
} from '../../../store/reselect/lightning';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import { zipLogs } from '../../../utils/lightning/logs';
import { SettingsScreenProps } from '../../../navigation/types';

const Channel = memo(
	({
		channelId,
		disabled,
		onPress,
	}: {
		channelId: string;
		disabled: boolean;
		onPress: () => void;
	}): ReactElement => {
		const name = useLightningChannelName(channelId);
		return (
			<TouchableOpacity onPress={onPress} style={styles.nRoot}>
				<View style={styles.nTitle}>
					<Text01M
						style={styles.nName}
						numberOfLines={1}
						ellipsizeMode="middle">
						{name}
					</Text01M>
					<ChevronRight color="gray1" />
				</View>
				<LightningChannel channelId={channelId} disabled={disabled} />
			</TouchableOpacity>
		);
	},
);

const ChannelList = memo(
	({
		channelIds,
		allChannels,
		onChannelPress,
	}: {
		allChannels: { [key: string]: TChannel };
		channelIds: string[];
		onChannelPress: Function;
	}): ReactElement => {
		return (
			<>
				{channelIds.map((channelId) => {
					const channel = allChannels[channelId];
					return (
						<Channel
							key={channelId}
							channelId={channelId}
							disabled={!channel.is_usable}
							onPress={(): void => onChannelPress(channelId)}
						/>
					);
				})}
			</>
		);
	},
);

const Channels = ({
	navigation,
}: SettingsScreenProps<'Channels'>): ReactElement => {
	const [closed, setClosed] = useState<boolean>(false);
	const [payingInvoice, setPayingInvoice] = useState<boolean>(false);
	const [refreshingLdk, setRefreshingLdk] = useState<boolean>(false);
	const [restartingLdk, setRestartingLdk] = useState<boolean>(false);
	const [rebroadcastingLdk, setRebroadcastingLdk] = useState(false);
	const [peer, setPeer] = useState<string>('');

	const colors = useColors();
	const balance = useBalance({ onchain: true });
	const { localBalance, remoteBalance } = useLightningBalance(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const channels = useSelector((state: Store) => {
		return channelsSelector(state, selectedWallet, selectedNetwork);
	});
	const openChannelIds = useSelector((state: Store) => {
		return openChannelIdsSelector(state, selectedWallet, selectedNetwork);
	});
	const enableDevOptions = useSelector(enableDevOptionsSelector);

	const openChannels = useSelector((state: Store) => {
		return isChannelReadySelector(state, selectedWallet, selectedNetwork);
	});

	const pendingChannels = useSelector((state: Store) => {
		return pendingChannelsSelector(state, selectedWallet, selectedNetwork);
	});

	const closedChannels = useSelector((state: Store) => {
		return closedChannelsSelector(state, selectedWallet, selectedNetwork);
	});

	const handleAdd = useCallback((): void => {
		navigation.navigate('LightningRoot', {
			screen: 'Introduction',
		});

		// TODO: Update this view once we enable creating channels with nodes other than Blocktank.
		//navigation.navigate('LightningAddConnection');

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleExportLogs = useCallback(async (): Promise<void> => {
		const res = await zipLogs();
		if (res.isErr()) {
			return showErrorNotification({
				title: 'Failed to share logs',
				message: res.error.message,
			});
		}

		// Share the zip file
		await Share.open({
			type: 'application/zip',
			url: `file://${res.value}`,
			title: 'Export Lightning Logs',
		});
	}, []);

	const onChannelPress = useCallback((channelId: string) => {
		navigation.navigate('ChannelDetails', { channelId });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const createInvoice = async (amountSats = 100): Promise<void> => {
		const createPaymentRequest = await createLightningInvoice({
			amountSats,
			description: '',
			expiryDeltaSeconds: 99999,
			selectedNetwork,
			selectedWallet,
		});
		if (createPaymentRequest.isErr()) {
			showErrorNotification({
				title: 'Failed to Create Invoice',
				message: createPaymentRequest.error.message,
			});
			return;
		}
		const { to_str } = createPaymentRequest.value;
		console.log(to_str);
		Clipboard.setString(to_str);
		showSuccessNotification({
			title: 'Copied Invoice to Clipboard',
			message: to_str,
		});
	};

	const onRefreshLdk = useCallback(async (): Promise<void> => {
		setRefreshingLdk(true);
		await refreshLdk({ selectedWallet, selectedNetwork });
		setRefreshingLdk(false);
	}, [selectedNetwork, selectedWallet]);

	const addConnectionIsDisabled = useMemo(() => {
		return balance.satoshis <= ETransactionDefaults.recommendedBaseFee;
	}, [balance.satoshis]);

	const onAddPeer = useCallback(async () => {
		if (!peer) {
			// Attempt to grab and set peer string from clipboard.
			const clipboardStr = await Clipboard.getString();
			setPeer(clipboardStr);
			return;
		}
		const addPeerRes = await addPeer({
			peer,
			timeout: 5000,
		});
		if (addPeerRes.isErr()) {
			showErrorNotification({
				title: 'Unable to add lightning peer',
				message: addPeerRes.error.message,
			});
			return;
		}
		const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
		if (savePeerRes.isErr()) {
			showErrorNotification({
				title: 'Unable to save lightning peer',
				message: savePeerRes.error.message,
			});
			return;
		}
		showSuccessNotification({
			title: savePeerRes.value,
			message: 'Lightning peer added & saved',
		});
	}, [peer, selectedNetwork, selectedWallet]);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Lightning Connections"
				onAddPress={addConnectionIsDisabled ? undefined : handleAdd}
			/>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshingLdk} onRefresh={onRefreshLdk} />
				}>
				<View style={styles.balances}>
					<View style={styles.balance}>
						<Caption13Up color="gray1">Spending balance</Caption13Up>
						<View style={styles.row}>
							<UpArrow color="purple" width={22} height={22} />
							<Money
								sats={localBalance}
								color="purple"
								size="title"
								unit="satoshi"
							/>
						</View>
					</View>
					<View style={styles.balance}>
						<Caption13Up color="gray1">Receiving capacity</Caption13Up>
						<View style={styles.row}>
							<DownArrow color="white" width={22} height={22} />
							<Money
								sats={remoteBalance}
								color="white"
								size="title"
								unit="satoshi"
							/>
						</View>
					</View>
				</View>

				{pendingChannels.length > 0 && (
					<>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							Pending connections
						</Caption13Up>
						<ChannelList
							allChannels={channels}
							channelIds={pendingChannels}
							onChannelPress={onChannelPress}
						/>
					</>
				)}

				<Caption13Up color="gray1" style={styles.sectionTitle}>
					Open connections
				</Caption13Up>
				<ChannelList
					allChannels={channels}
					channelIds={openChannels}
					onChannelPress={onChannelPress}
				/>

				{closed && (
					<AnimatedView entering={FadeIn} exiting={FadeOut}>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							Closed connections
						</Caption13Up>
						<ChannelList
							allChannels={channels}
							channelIds={closedChannels}
							onChannelPress={onChannelPress}
						/>
					</AnimatedView>
				)}

				{enableDevOptions && (
					<>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							Dev Options
						</Caption13Up>
						<TextInput
							selectionColor="orange"
							autoCapitalize="none"
							// @ts-ignore autoCompleteType -> autoComplete in newer version
							autoCompleteType="off"
							autoCorrect={false}
							autoFocus={false}
							style={styles.textInput}
							value={peer}
							placeholder="publicKey@ip:port"
							multiline={true}
							onChangeText={(txt: string): void => {
								setPeer(txt);
							}}
							blurOnSubmit
							returnKeyType="done"
						/>
						<Button
							style={styles.devButton}
							text={
								peer
									? 'Add Lightning Peer'
									: 'Paste Lightning Peer From Clipboard'
							}
							onPress={onAddPeer}
						/>
						<Button
							style={styles.devButton}
							text="Refresh LDK"
							loading={refreshingLdk}
							onPress={onRefreshLdk}
						/>
						<Button
							style={styles.devButton}
							text="Restart LDK"
							loading={restartingLdk}
							onPress={async (): Promise<void> => {
								setRestartingLdk(true);
								await setupLdk({ selectedWallet, selectedNetwork });
								setRestartingLdk(false);
							}}
						/>
						<Button
							style={styles.devButton}
							text="Rebroadcast LDK TXS"
							loading={rebroadcastingLdk}
							onPress={async (): Promise<void> => {
								setRebroadcastingLdk(true);
								await rebroadcastAllKnownTransactions();
								setRebroadcastingLdk(false);
							}}
						/>
						<Button
							style={styles.devButton}
							text="Get Node ID"
							onPress={async (): Promise<void> => {
								const nodeId = await getNodeId();
								if (nodeId.isErr()) {
									console.log(nodeId.error.message);
									return;
								}
								console.log(nodeId.value);
								Clipboard.setString(nodeId.value);
								showSuccessNotification({
									title: 'Copied Node ID to Clipboard',
									message: nodeId.value,
								});
							}}
						/>

						{openChannelIds.length > 0 && (
							<>
								{remoteBalance > 100 && (
									<Button
										text={'Create Invoice: 100 sats'}
										onPress={async (): Promise<void> => {
											createInvoice(100).then();
										}}
									/>
								)}
								{remoteBalance > 5000 && (
									<Button
										text="Create Invoice: 5000 sats"
										onPress={async (): Promise<void> => {
											createInvoice(5000).then();
										}}
									/>
								)}
								{localBalance > 0 && (
									<>
										<Button
											text="Pay Invoice From Clipboard"
											loading={payingInvoice}
											onPress={async (): Promise<void> => {
												setPayingInvoice(true);
												const invoice = await Clipboard.getString();
												if (!invoice) {
													showErrorNotification({
														title: 'No Invoice Detected',
														message:
															'Unable to retrieve anything from the clipboard.',
													});
												}
												const response = await payLightningInvoice(invoice);
												if (response.isErr()) {
													showErrorNotification({
														title: 'Invoice Payment Failed',
														message: response.error.message,
													});
													setPayingInvoice(false);
													return;
												}
												await Promise.all([
													refreshLdk({ selectedWallet, selectedNetwork }),
												]);
												setPayingInvoice(false);
												showSuccessNotification({
													title: 'Invoice Payment Success',
													message: `Fee: ${response.value.fee_paid_sat} sats`,
												});
											}}
										/>
									</>
								)}
							</>
						)}
					</>
				)}

				{!closed && closedChannels.length > 0 && (
					<Button
						style={styles.button}
						text="Show Closed & Failed"
						textStyle={{ color: colors.white8 }}
						size="large"
						variant="transparent"
						onPress={(): void => setClosed((c) => !c)}
					/>
				)}

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text="Export Logs"
						size="large"
						variant="secondary"
						onPress={handleExportLogs}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text="Add Connection"
						size="large"
						disabled={addConnectionIsDisabled}
						onPress={handleAdd}
					/>
				</View>
			</ScrollView>
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
	},
	content: {
		paddingHorizontal: 16,
		flexGrow: 1,
	},
	balances: {
		flexDirection: 'row',
	},
	balance: {
		flex: 1,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	row: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	sectionTitle: {
		marginTop: 16,
	},
	nRoot: {
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	nTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 16,
		marginBottom: 8,
	},
	nName: {
		marginRight: 8,
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
	devButton: {
		marginTop: 8,
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(Channels);
