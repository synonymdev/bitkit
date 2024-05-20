import React, { ReactElement, memo, useState, useCallback } from 'react';
import {
	StyleSheet,
	View,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
} from 'react-native';
import Share from 'react-native-share';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';
import { BtOrderState2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/BtOrderState2';

import {
	AnimatedView,
	View as ThemedView,
	TextInput,
} from '../../../styles/components';
import { Caption13Up, BodyMSB } from '../../../styles/text';
import {
	ChevronRight,
	DownArrow,
	UpArrow,
	PlusIcon,
} from '../../../styles/icons';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel, {
	TStatus,
} from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import useColors from '../../../hooks/colors';
import { useAppSelector } from '../../../hooks/redux';
import { refreshOrdersList } from '../../../store/utils/blocktank';
import {
	addPeer,
	getNodeId,
	payLightningInvoice,
	rebroadcastAllKnownTransactions,
	recoverOutputs,
	recoverOutputsFromForceClose,
	refreshLdk,
	setupLdk,
} from '../../../utils/lightning';
import { showToast } from '../../../utils/notifications';
import {
	useLightningChannelName,
	useLightningBalance,
} from '../../../hooks/lightning';
import {
	createLightningInvoice,
	savePeer,
} from '../../../store/utils/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import {
	closedChannelsSelector,
	openChannelsSelector,
	pendingChannelsSelector,
} from '../../../store/reselect/lightning';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import { zipLogs } from '../../../utils/lightning/logs';
import { SettingsScreenProps } from '../../../navigation/types';
import {
	blocktankOrdersSelector,
	blocktankPaidOrdersSelector,
} from '../../../store/reselect/blocktank';
import { TPaidBlocktankOrders } from '../../../store/types/blocktank';
import { EUnit } from '../../../store/types/wallet';
import { showBottomSheet } from '../../../store/utils/ui';
import { EChannelStatus, TChannel } from '../../../store/types/lightning';

/**
 * Convert pending (non-channel) blocktank orders to (fake) channels.
 * @param {IBtOrder[]} orders
 * @param {TPaidBlocktankOrders} paidOrders
 * @param {string} nodeKey
 */
const getPendingBlocktankChannels = (
	orders: IBtOrder[],
	paidOrders: TPaidBlocktankOrders,
	nodeKey: string,
): {
	pendingOrders: TChannel[];
	failedOrders: TChannel[];
} => {
	const pendingOrders: TChannel[] = [];
	const failedOrders: TChannel[] = [];

	Object.keys(paidOrders).forEach((orderId) => {
		let order = orders.find((o) => o.id === orderId)!;
		if (!order) {
			// In the event it was paid for using the old api.
			// @ts-ignore
			order = orders.find((o) => o?._id === orderId)!;
			if (!order) {
				return;
			}
		}
		const fakeChannel: TChannel = {
			channel_id: order.id,
			confirmations: 0,
			status: EChannelStatus.pending,
			is_public: false,
			is_usable: false,
			is_channel_ready: false,
			is_outbound: false,
			balance_sat: order.lspBalanceSat,
			counterparty_node_id: nodeKey,
			funding_txid: order.channel?.fundingTx.id,
			user_channel_id: '0',
			inbound_scid_alias: '',
			inbound_payment_scid: '',
			inbound_capacity_sat: order.lspBalanceSat,
			outbound_capacity_sat: order.clientBalanceSat,
			channel_value_satoshis: order.lspBalanceSat + order.clientBalanceSat,
			short_channel_id: order.id,
			config_forwarding_fee_base_msat: 0,
			config_forwarding_fee_proportional_millionths: 0,
			claimable_balances: [],
			createdAt: new Date().getTime(),
		};

		if ([BtOrderState2.CREATED, BtOrderState2.PAID].includes(order.state2)) {
			pendingOrders.push(fakeChannel);
		}

		if (order.state2 === BtOrderState2.EXPIRED) {
			failedOrders.push(fakeChannel);
		}
	});

	return { pendingOrders, failedOrders };
};

const Channel = memo(
	({
		channel,
		pending,
		closed,
		onPress,
	}: {
		channel: TChannel;
		pending?: boolean;
		closed?: boolean;
		onPress: (channel: TChannel) => void;
	}): ReactElement => {
		const channelName = useLightningChannelName(channel);

		const getChannelStatus = (): TStatus => {
			if (pending) {
				return 'pending';
			} else if (closed) {
				return 'closed';
			} else {
				return 'open';
			}
		};

		return (
			<TouchableOpacity
				style={styles.nRoot}
				testID="Channel"
				onPress={(): void => onPress(channel)}>
				<View style={styles.nTitle}>
					<BodyMSB
						style={styles.nName}
						color={closed ? 'white50' : 'white'}
						numberOfLines={1}
						ellipsizeMode="middle">
						{channelName}
					</BodyMSB>
					<ChevronRight color="white50" height={24} />
				</View>
				<LightningChannel channel={channel} status={getChannelStatus()} />
			</TouchableOpacity>
		);
	},
);

const ChannelList = memo(
	({
		channels,
		pending,
		closed,
		onChannelPress,
	}: {
		channels: TChannel[];
		pending?: boolean;
		closed?: boolean;
		onChannelPress: (channel: TChannel) => void;
	}): ReactElement => {
		return (
			<>
				{channels.map((channel) => (
					<Channel
						key={channel.channel_id}
						channel={channel}
						pending={pending}
						closed={closed}
						onPress={onChannelPress}
					/>
				))}
			</>
		);
	},
);

const Channels = ({
	navigation,
	route,
}: SettingsScreenProps<'Channels'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [peer, setPeer] = useState('');
	const [showClosed, setShowClosed] = useState(
		route.params?.showClosed ?? false,
	);
	const [payingInvoice, setPayingInvoice] = useState(false);
	const [refreshingLdk, setRefreshingLdk] = useState(false);
	const [restartingLdk, setRestartingLdk] = useState(false);
	const [rebroadcastingLdk, setRebroadcastingLdk] = useState(false);
	const [spendingStuckOutputs, setSpendingStuckOutputs] = useState(false);

	const colors = useColors();
	const { localBalance, remoteBalance } = useLightningBalance();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const enableDevOptions = useAppSelector(enableDevOptionsSelector);

	const blocktankOrders = useAppSelector(blocktankOrdersSelector);
	const paidOrders = useAppSelector(blocktankPaidOrdersSelector);
	const openChannels = useAppSelector(openChannelsSelector);
	const pendingChannels = useAppSelector(pendingChannelsSelector);
	const closedChannels = useAppSelector(closedChannelsSelector);
	const blocktankNodeKey = useAppSelector((state) => {
		return state.blocktank.info.nodes[0]?.pubkey;
	});

	const { pendingOrders, failedOrders } = getPendingBlocktankChannels(
		blocktankOrders,
		paidOrders,
		blocktankNodeKey,
	);
	const pendingConnections = [...pendingOrders, ...pendingChannels];

	const handleAdd = useCallback((): void => {
		navigation.navigate('LightningRoot', { screen: 'Funding' });

		// TODO: Update this view once we enable creating channels with nodes other than Blocktank.
		// navigation.navigate('LightningAddConnection');
	}, [navigation]);

	const handleExportLogs = useCallback(async (): Promise<void> => {
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
	}, [t]);

	const onChannelPress = useCallback(
		(channel: TChannel) => {
			navigation.navigate('ChannelDetails', { channel });
		},
		[navigation],
	);

	const createInvoice = async (amountSats = 100): Promise<void> => {
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

	const onRefreshLdk = useCallback(async (): Promise<void> => {
		setRefreshingLdk(true);
		await refreshLdk({ selectedWallet, selectedNetwork });
		await refreshOrdersList();
		setRefreshingLdk(false);
	}, [selectedNetwork, selectedWallet]);

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
	}, [peer, selectedNetwork, selectedWallet, t]);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('connections')}
				actionIcon={<PlusIcon width={24} height={24} />}
				onActionPress={handleAdd}
			/>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={refreshingLdk}
						tintColor={colors.refreshControl}
						onRefresh={onRefreshLdk}
					/>
				}>
				<View style={styles.balances}>
					<View style={styles.balance}>
						<Caption13Up color="white50">{t('spending_label')}</Caption13Up>
						<View style={styles.row}>
							<UpArrow color="purple" width={22} height={22} />
							<Money
								sats={localBalance}
								color="purple"
								size="title"
								unit={EUnit.BTC}
							/>
						</View>
					</View>
					<View style={styles.balance}>
						<Caption13Up color="white50">{t('receiving_label')}</Caption13Up>
						<View style={styles.row}>
							<DownArrow color="white" width={22} height={22} />
							<Money
								sats={remoteBalance}
								color="white"
								size="title"
								unit={EUnit.BTC}
							/>
						</View>
					</View>
				</View>

				{pendingConnections.length > 0 && (
					<>
						<Caption13Up color="white50" style={styles.sectionTitle}>
							{t('conn_pending')}
						</Caption13Up>
						<ChannelList
							channels={pendingConnections.reverse()}
							pending={true}
							onChannelPress={onChannelPress}
						/>
					</>
				)}

				{openChannels.length > 0 && (
					<>
						<Caption13Up color="white50" style={styles.sectionTitle}>
							{t('conn_open')}
						</Caption13Up>
						<ChannelList
							channels={openChannels.reverse()}
							onChannelPress={onChannelPress}
						/>
					</>
				)}

				{showClosed && (
					<AnimatedView entering={FadeIn} exiting={FadeOut}>
						{closedChannels.length > 0 && (
							<>
								<Caption13Up color="white50" style={styles.sectionTitle}>
									{t('conn_closed')}
								</Caption13Up>
								<ChannelList
									channels={closedChannels.reverse()}
									closed={true}
									onChannelPress={onChannelPress}
								/>
							</>
						)}
						{failedOrders.length > 0 && (
							<>
								<Caption13Up color="white50" style={styles.sectionTitle}>
									{t('conn_failed')}
								</Caption13Up>
								<ChannelList
									channels={failedOrders.reverse()}
									closed={true}
									onChannelPress={onChannelPress}
								/>
							</>
						)}
					</AnimatedView>
				)}

				{(closedChannels.length > 0 || failedOrders.length > 0) && (
					<Button
						text={t(showClosed ? 'conn_closed_hide' : 'conn_closed_show')}
						textStyle={{ color: colors.white80 }}
						size="large"
						variant="transparent"
						onPress={(): void => setShowClosed((prevState) => !prevState)}
					/>
				)}

				{enableDevOptions && (
					<View style={styles.devButtons}>
						<Caption13Up color="white50" style={styles.sectionTitle}>
							Dev Options
						</Caption13Up>
						<TextInput
							autoCapitalize="none"
							autoComplete="off"
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
							testID="AddPeerInput"
						/>
						<Button
							style={styles.devButton}
							text={
								peer
									? 'Add Lightning Peer'
									: 'Paste Lightning Peer From Clipboard'
							}
							onPress={onAddPeer}
							testID="AddPeerButton"
						/>
						<Button
							style={styles.devButton}
							text="Refresh LDK"
							loading={refreshingLdk}
							onPress={onRefreshLdk}
							testID="RefreshLDK"
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
							testID="RestartLDK"
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
							testID="RebroadcastLDKTXS"
						/>
						<Button
							style={styles.devButton}
							text="Spend stuck outputs"
							loading={spendingStuckOutputs}
							onPress={async (): Promise<void> => {
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
							}}
						/>
						<Button
							style={styles.devButton}
							text="Force close channels"
							onPress={(): void => {
								showBottomSheet('forceTransfer');
							}}
						/>
						<Button
							style={styles.devButton}
							text="Spend outputs from force close"
							loading={spendingStuckOutputs}
							onPress={async (): Promise<void> => {
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
								showToast({
									type: 'success',
									title: 'Copied Node ID to Clipboard',
									description: nodeId.value,
								});
							}}
							testID="CopyNodeId"
						/>

						{openChannels.length > 0 && (
							<>
								{remoteBalance > 100 && (
									<Button
										style={styles.devButton}
										text="Create Invoice: 100 sats"
										onPress={async (): Promise<void> => {
											createInvoice(100).then();
										}}
									/>
								)}
								{remoteBalance > 5000 && (
									<Button
										style={styles.devButton}
										text="Create Invoice: 5000 sats"
										onPress={async (): Promise<void> => {
											createInvoice(5000).then();
										}}
									/>
								)}
								{localBalance > 0 && (
									<>
										<Button
											style={styles.devButton}
											text="Pay Invoice From Clipboard"
											loading={payingInvoice}
											onPress={async (): Promise<void> => {
												setPayingInvoice(true);
												const invoice = await Clipboard.getString();
												if (!invoice) {
													showToast({
														type: 'warning',
														title: 'No Invoice Detected',
														description:
															'Unable to retrieve anything from the clipboard.',
													});
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
											}}
										/>
									</>
								)}
							</>
						)}
					</View>
				)}

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('conn_button_export_logs')}
						size="large"
						variant="secondary"
						onPress={handleExportLogs}
					/>
					<Button
						style={styles.button}
						text={t('conn_button_add')}
						size="large"
						onPress={handleAdd}
					/>
				</View>
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
		paddingTop: 16,
		paddingHorizontal: 16,
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
	devButtons: {
		marginTop: 'auto',
	},
	devButton: {
		marginTop: 8,
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Channels);
