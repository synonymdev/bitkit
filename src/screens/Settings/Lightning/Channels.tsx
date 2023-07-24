import React, { ReactElement, memo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Share from 'react-native-share';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { IGetOrderResponse } from '@synonymdev/blocktank-client';
import { TChannel } from '@synonymdev/react-native-ldk';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	AnimatedView,
	RefreshControl,
	View as ThemedView,
	TextInput,
} from '../../../styles/components';
import { Caption13Up, Text01M } from '../../../styles/text';
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
import { refreshOrdersList } from '../../../store/actions/blocktank';
import {
	addPeer,
	getNodeId,
	payLightningInvoice,
	rebroadcastAllKnownTransactions,
	recoverOutputs,
	refreshLdk,
	setupLdk,
} from '../../../utils/lightning';
import { showToast } from '../../../utils/notifications';
import Store from '../../../store/types';
import { usePaidBlocktankOrders } from '../../../hooks/blocktank';
import {
	useLightningChannelName,
	useLightningBalance,
} from '../../../hooks/lightning';
import {
	createLightningInvoice,
	savePeer,
} from '../../../store/actions/lightning';
import { useBalance } from '../../../hooks/wallet';
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
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';
import { zipLogs } from '../../../utils/lightning/logs';
import { SettingsScreenProps } from '../../../navigation/types';
import {
	blocktankOrdersSelector,
	blocktankPaidOrdersSelector,
} from '../../../store/reselect/blocktank';
import { TPaidBlocktankOrders } from '../../../store/types/blocktank';
import { EUnit } from '../../../store/types/wallet';

// Workaround for crash on Android
// https://github.com/software-mansion/react-native-reanimated/issues/4306#issuecomment-1538184321
const AnimatedRefreshControl = Animated.createAnimatedComponent(RefreshControl);

/**
 * Convert pending (non-channel) blocktank orders to (fake) channels.
 * @param {IGetOrderResponse[]} orders
 * @param {string} nodeKey
 */
const getPendingBlocktankChannels = (
	orders: IGetOrderResponse[],
	paidOrders: TPaidBlocktankOrders,
	nodeKey: string,
): {
	pendingOrders: TChannel[];
	failedOrders: TChannel[];
} => {
	const pendingOrders: TChannel[] = [];
	const failedOrders: TChannel[] = [];

	Object.keys(paidOrders).forEach((orderId) => {
		const order = orders.find((o) => o._id === orderId)!;

		const fakeChannel: TChannel = {
			channel_id: order._id,
			is_public: false,
			is_usable: false,
			is_channel_ready: false,
			is_outbound: false,
			balance_sat: order.local_balance,
			counterparty_node_id: nodeKey,
			funding_txid: order.channel_open_tx?.transaction_id,
			// channel_type: string,
			user_channel_id: '0',
			// short_channel_id: number,
			inbound_capacity_sat: order.local_balance,
			outbound_capacity_sat: order.remote_balance,
			channel_value_satoshis: order.local_balance + order.remote_balance,
			short_channel_id: order._id,
			config_forwarding_fee_base_msat: 0,
			config_forwarding_fee_proportional_millionths: 0,
		};

		if ([0, 100, 150, 200].includes(order.state)) {
			pendingOrders.push(fakeChannel);
		}
		if ([400, 410].includes(order.state)) {
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
		const paidBlocktankOrders = usePaidBlocktankOrders();
		const blocktankOrder = Object.values(paidBlocktankOrders).find((order) => {
			// real channel
			if (channel.funding_txid) {
				return order.channel_open_tx?.transaction_id === channel.funding_txid;
			}

			// fake channel
			return order._id === channel.channel_id;
		});

		const channelName = useLightningChannelName(channel, blocktankOrder);

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
				onPress={(): void => onPress(channel)}
				testID="Channel">
				<View style={styles.nTitle}>
					<Text01M
						style={styles.nName}
						color={closed ? 'gray1' : 'white'}
						numberOfLines={1}
						ellipsizeMode="middle">
						{channelName}
					</Text01M>
					<ChevronRight color="gray1" height={24} />
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
}: SettingsScreenProps<'Channels'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [peer, setPeer] = useState('');
	const [showClosed, setShowClosed] = useState(false);
	const [payingInvoice, setPayingInvoice] = useState(false);
	const [refreshingLdk, setRefreshingLdk] = useState(false);
	const [restartingLdk, setRestartingLdk] = useState(false);
	const [rebroadcastingLdk, setRebroadcastingLdk] = useState(false);
	const [spendingStuckOutputs, setSpendingStuckOutputs] = useState(false);

	const colors = useColors();
	const { onchainBalance } = useBalance();
	const { localBalance, remoteBalance } = useLightningBalance(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const enableDevOptions = useSelector(enableDevOptionsSelector);

	const blocktankOrders = useSelector(blocktankOrdersSelector);
	const paidOrders = useSelector(blocktankPaidOrdersSelector);
	const openChannels = useSelector((state: Store) => {
		return openChannelsSelector(state, selectedWallet, selectedNetwork);
	});
	const pendingChannels = useSelector((state: Store) => {
		return pendingChannelsSelector(state, selectedWallet, selectedNetwork);
	});
	const closedChannels = useSelector((state: Store) => {
		return closedChannelsSelector(state, selectedWallet, selectedNetwork);
	});
	const blocktankNodeKey = useSelector((state: Store) => {
		return state.blocktank.info.node_info.public_key;
	});

	const { pendingOrders, failedOrders } = getPendingBlocktankChannels(
		blocktankOrders,
		paidOrders,
		blocktankNodeKey,
	);
	const pendingConnections = [...pendingOrders, ...pendingChannels];

	const handleAdd = useCallback((): void => {
		navigation.navigate('LightningRoot', {
			screen: 'CustomSetup',
			params: { spending: true },
		});

		// TODO: Update this view once we enable creating channels with nodes other than Blocktank.
		// navigation.navigate('LightningAddConnection');
	}, [navigation]);

	const handleExportLogs = useCallback(async (): Promise<void> => {
		const result = await zipLogs({ includeJson: enableDevOptions });
		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('error_logs'),
				description: result.error.message,
			});
			return;
		}

		// Share the zip file
		await Share.open({
			type: 'application/zip',
			url: `file://${result.value}`,
			title: t('export_logs'),
		});
	}, [t, enableDevOptions]);

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
				type: 'error',
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
				type: 'error',
				title: t('error_add'),
				description: addPeerRes.error.message,
			});
			return;
		}
		const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
		if (savePeerRes.isErr()) {
			showToast({
				type: 'error',
				title: t('error_save'),
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

	const addConnectionIsDisabled =
		onchainBalance <= TRANSACTION_DEFAULTS.recommendedBaseFee;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('connections')}
				onActionPress={addConnectionIsDisabled ? undefined : handleAdd}
				actionIcon={<PlusIcon width={24} height={24} />}
			/>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<AnimatedRefreshControl
						refreshing={refreshingLdk}
						exiting={FadeOut}
						onRefresh={onRefreshLdk}
					/>
				}>
				<View style={styles.balances}>
					<View style={styles.balance}>
						<Caption13Up color="gray1">{t('spending_label')}</Caption13Up>
						<View style={styles.row}>
							<UpArrow color="purple" width={22} height={22} />
							<Money
								sats={localBalance}
								color="purple"
								size="title"
								unit={EUnit.satoshi}
							/>
						</View>
					</View>
					<View style={styles.balance}>
						<Caption13Up color="gray1">{t('receiving_label')}</Caption13Up>
						<View style={styles.row}>
							<DownArrow color="white" width={22} height={22} />
							<Money
								sats={remoteBalance}
								color="white"
								size="title"
								unit={EUnit.satoshi}
							/>
						</View>
					</View>
				</View>

				{pendingConnections.length > 0 && (
					<>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
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
						<Caption13Up color="gray1" style={styles.sectionTitle}>
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
								<Caption13Up color="gray1" style={styles.sectionTitle}>
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
								<Caption13Up color="gray1" style={styles.sectionTitle}>
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
						textStyle={{ color: colors.white8 }}
						size="large"
						variant="transparent"
						onPress={(): void => setShowClosed((prevState) => !prevState)}
					/>
				)}

				{enableDevOptions && (
					<>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							Dev Options
						</Caption13Up>
						<TextInput
							selectionColor="orange"
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
										type: 'error',
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
														type: 'error',
														title: 'No Invoice Detected',
														description:
															'Unable to retrieve anything from the clipboard.',
													});
												}
												const response = await payLightningInvoice(invoice);
												if (response.isErr()) {
													showToast({
														type: 'error',
														title: 'Invoice Payment Failed',
														description: response.error.message,
													});
													setPayingInvoice(false);
													return;
												}
												await Promise.all([
													refreshLdk({ selectedWallet, selectedNetwork }),
												]);
												setPayingInvoice(false);
												showToast({
													type: 'success',
													title: 'Invoice Payment Success',
													description: `Fee: ${response.value.fee_paid_sat} sats`,
												});
											}}
										/>
									</>
								)}
							</>
						)}
					</>
				)}

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('conn_button_export_logs')}
						size="large"
						variant="secondary"
						onPress={handleExportLogs}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('conn_button_add')}
						size="large"
						disabled={addConnectionIsDisabled}
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
