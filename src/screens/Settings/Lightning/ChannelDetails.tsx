import Clipboard from '@react-native-clipboard/clipboard';
import {
	BtOpenChannelState,
	BtOrderState2,
	BtPaymentState2,
	IBtOrder,
	ICJitEntry,
} from '@synonymdev/blocktank-lsp-http-client';
import React, { ReactElement, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import Button from '../../../components/buttons/Button';
import LightningChannel, {
	TStatus,
} from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { usePaidBlocktankOrders } from '../../../hooks/blocktank';
import useColors from '../../../hooks/colors';
import {
	useLightningChannelBalance,
	useLightningChannelName,
} from '../../../hooks/lightning';
import { useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';
import { cjitEntriesSelector } from '../../../store/reselect/blocktank';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { EChannelStatus } from '../../../store/types/lightning';
import { EUnit } from '../../../store/types/wallet';
import { refreshOrder, updateOrder } from '../../../store/utils/blocktank';
import { View as ThemedView } from '../../../styles/components';
import { Caption13Up, CaptionB } from '../../../styles/text';
import { openURL, sleep } from '../../../utils/helpers';
import { i18nTime } from '../../../utils/i18n';
import { showToast } from '../../../utils/notifications';
import { createOrderSupportLink } from '../../../utils/support';
import { getTransactions } from '../../../utils/wallet/electrum';
import { getBlockExplorerLink } from '../../../utils/wallet/transactions';
import ChannelStatus from './ChannelStatus';

const Section = memo(
	({
		name,
		value,
		testID,
		onPress,
	}: {
		name: string;
		value: ReactElement;
		testID?: string;
		onPress?: () => void;
	}): ReactElement => {
		return (
			<TouchableOpacity
				style={styles.sectionRoot}
				activeOpacity={onPress ? 0.7 : 1}
				onPress={onPress}>
				<View style={styles.sectionName}>
					<CaptionB>{name}</CaptionB>
				</View>
				<View style={styles.sectionValue} testID={testID}>
					{value}
				</View>
			</TouchableOpacity>
		);
	},
);

const ChannelDetails = ({
	navigation,
	route,
}: SettingsScreenProps<'ChannelDetails'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const { channel } = route.params;
	const [refreshing, setRefreshing] = useState(false);
	const colors = useColors();

	const [txTime, setTxTime] = useState<string>();
	const { spendingAvailable, receivingAvailable, capacity } =
		useLightningChannelBalance(channel);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const cjitEntries = useAppSelector(cjitEntriesSelector);
	const paidBlocktankOrders = usePaidBlocktankOrders();

	// Check if the channel was opened via CJIT
	const cjitEntry = cjitEntries.find((entry) => {
		return entry.channel?.fundingTx.id === channel.funding_txid;
	});

	// Check if the channel was opened via order
	const blocktankOrder = Object.values(paidBlocktankOrders).find((order) => {
		// real channel
		if (channel.funding_txid) {
			return order.channel?.fundingTx.id === channel.funding_txid;
		}

		// fake channel
		return order.id === channel.channel_id;
	});

	const order = blocktankOrder ?? cjitEntry;
	const channelName = useLightningChannelName(channel);
	const channelIsOpen = channel.status === EChannelStatus.open;
	const channelIsPending = channel.status === EChannelStatus.pending;

	useEffect(() => {
		if (blocktankOrder) {
			updateOrder(blocktankOrder.id).then();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!channel.funding_txid) {
			return;
		}
		getTransactions({
			txHashes: [{ tx_hash: channel.funding_txid }],
		}).then((txResponse) => {
			if (txResponse.isErr()) {
				return;
			}
			const txData = txResponse.value.data;
			if (txData.length === 0) {
				return;
			}
			const timestamp = txData[0].result.time;
			if (!timestamp) {
				return;
			}

			const formattedDate = tTime('dateTime', {
				v: new Date(timestamp * 1000),
				formatParams: {
					v: {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
						hour12: false,
					},
				},
			});

			setTxTime(formattedDate);
		});
	}, [selectedNetwork, channel.funding_txid, tTime]);

	const handleRefresh = async (): Promise<void> => {
		setRefreshing(true);
		await sleep(1000);
		if (blocktankOrder) {
			await refreshOrder(blocktankOrder.id);
		}
		setRefreshing(false);
	};

	const openSupportLink = async (
		_order: IBtOrder | ICJitEntry,
	): Promise<void> => {
		const link = await createOrderSupportLink(
			_order.id,
			`Transaction ID: ${_order.channel?.fundingTx.id}`,
		);
		const res = await openURL(link);
		if (!res) {
			await openURL('https://synonym.to/contact');
		}
	};

	const getChannelStatus = (): TStatus => {
		if (channel.status !== EChannelStatus.pending) {
			return channel.status;
		}

		// If the channel is with the LSP, we can show a more accurate status for pending channels
		if (blocktankOrder) {
			switch (blocktankOrder.channel?.state) {
				case BtOpenChannelState.OPENING:
					return 'pending';
			}
			switch (blocktankOrder.state2) {
				case BtOrderState2.CREATED:
				case BtOrderState2.PAID:
					return 'pending';
				case BtOrderState2.EXPIRED:
					return 'closed';
			}
			switch (blocktankOrder.payment.state2) {
				case BtPaymentState2.CANCELED:
				case BtPaymentState2.REFUNDED:
				case BtPaymentState2.REFUND_AVAILABLE:
					return 'closed';
			}
		}

		return channel.status;
	};

	let channelCloseTime: string | undefined;
	if (order?.channel?.close) {
		channelCloseTime = tTime('dateTime', {
			v: new Date(order.channel.close.registeredAt),
			formatParams: {
				v: {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				},
			},
		});
	}

	const orderFee = blocktankOrder
		? blocktankOrder.feeSat - blocktankOrder.clientBalanceSat
		: order?.feeSat;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={channelName} />
			<ScrollView
				contentContainerStyle={styles.content}
				testID="ChannelScrollView"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={colors.refreshControl}
					/>
				}>
				<View style={styles.channel}>
					<LightningChannel
						capacity={capacity}
						localBalance={spendingAvailable}
						remoteBalance={receivingAvailable}
						status={getChannelStatus()}
					/>
				</View>

				<View style={styles.status}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="secondary">{t('status')}</Caption13Up>
					</View>
					<ChannelStatus
						status={channel.status}
						order={blocktankOrder}
						isUsable={channel.is_usable}
					/>
				</View>

				{order && (
					<View style={styles.section}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="secondary">{t('order_details')}</Caption13Up>
						</View>
						<Section
							name={t('order')}
							value={
								<CaptionB ellipsizeMode="middle" numberOfLines={1}>
									{order.id}
								</CaptionB>
							}
							onPress={(): void => {
								Clipboard.setString(order.id);
								showToast({
									type: 'success',
									title: t('copied'),
									description: order.id,
								});
							}}
						/>
						<Section
							name={t('created_on')}
							value={
								<CaptionB>
									{tTime('dateTime', {
										v: new Date(order.createdAt),
										formatParams: {
											v: {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: 'numeric',
												minute: 'numeric',
												hour12: false,
											},
										},
									})}
								</CaptionB>
							}
						/>
						{blocktankOrder?.orderExpiresAt && channelIsPending && (
							<Section
								name={t('order_expiry')}
								value={
									<CaptionB>
										{tTime('dateTime', {
											v: new Date(blocktankOrder.orderExpiresAt),
											formatParams: {
												v: {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
													hour: 'numeric',
													minute: 'numeric',
													hour12: false,
												},
											},
										})}
									</CaptionB>
								}
							/>
						)}
						{channel.funding_txid && (
							<Section
								name={t('transaction')}
								value={
									<CaptionB ellipsizeMode="middle" numberOfLines={1}>
										{channel.funding_txid}
									</CaptionB>
								}
								onPress={(): void => {
									if (channel.funding_txid) {
										const blockExplorerUrl = getBlockExplorerLink(
											channel.funding_txid,
										);
										Clipboard.setString(channel.funding_txid);
										openURL(blockExplorerUrl).then();
									}
								}}
							/>
						)}

						{orderFee && (
							<Section
								name={t('order_fee')}
								value={
									<Money
										sats={orderFee}
										size="captionB"
										color="white"
										symbol={true}
										symbolColor="secondary"
										unit={EUnit.BTC}
									/>
								}
							/>
						)}
					</View>
				)}

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="secondary">{t('balance')}</Caption13Up>
					</View>
					<Section
						name={t('receiving_label')}
						value={
							<Money
								sats={receivingAvailable}
								size="captionB"
								symbol={true}
								symbolColor="secondary"
								color="white"
								unit={EUnit.BTC}
							/>
						}
					/>
					<Section
						name={t('spending_label')}
						value={
							<Money
								sats={spendingAvailable}
								size="captionB"
								symbol={true}
								symbolColor="secondary"
								color="white"
								unit={EUnit.BTC}
							/>
						}
					/>
					<Section
						name={t('reserve_balance')}
						value={
							<Money
								sats={Number(channel.unspendable_punishment_reserve)}
								size="captionB"
								symbol={true}
								symbolColor="secondary"
								color="white"
								unit={EUnit.BTC}
							/>
						}
					/>
					<Section
						name={t('total_size')}
						testID="TotalSize"
						value={
							<Money
								sats={capacity}
								size="captionB"
								symbol={true}
								symbolColor="secondary"
								color="white"
								unit={EUnit.BTC}
							/>
						}
					/>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="secondary">{t('fees')}</Caption13Up>
					</View>
					<Section
						name={t('base_fee')}
						value={
							<Money
								sats={channel.config_forwarding_fee_base_msat / 1000}
								size="captionB"
								symbol={true}
								symbolColor="secondary"
								color="white"
								unit={EUnit.BTC}
							/>
						}
					/>
					<Section
						name={t('fee_rate')}
						value={
							<CaptionB>
								{channel.config_forwarding_fee_proportional_millionths} ppm
							</CaptionB>
						}
					/>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="secondary">{t('other')}</Caption13Up>
					</View>
					<Section
						name={t('is_usable')}
						testID={channel.is_usable ? 'IsUsableYes' : 'IsUsableNo'}
						value={
							<CaptionB>{t(channel.is_usable ? t('yes') : t('no'))}</CaptionB>
						}
					/>
					{txTime && (
						<Section
							name={t('opened_on')}
							value={<CaptionB>{txTime}</CaptionB>}
						/>
					)}
					{channelCloseTime && (
						<Section
							name={t('closed_on')}
							value={<CaptionB>{channelCloseTime}</CaptionB>}
						/>
					)}
					{channel.channel_id && (
						<Section
							name={t('channel_id')}
							value={
								<CaptionB ellipsizeMode="middle" numberOfLines={1}>
									{channel.channel_id}
								</CaptionB>
							}
							onPress={(): void => {
								Clipboard.setString(channel.channel_id);
								showToast({
									type: 'success',
									title: t('copied'),
									description: channel.channel_id,
								});
							}}
						/>
					)}
					{channel.funding_txid && (
						<Section
							name={t('channel_point')}
							value={
								<CaptionB ellipsizeMode="middle" numberOfLines={1}>
									{channel.funding_txid}:{channel.funding_output_index}
								</CaptionB>
							}
							onPress={(): void => {
								const p = `${channel.funding_txid}:${channel.funding_output_index}`;
								Clipboard.setString(p);
								showToast({
									type: 'success',
									title: t('copied'),
									description: p,
								});
							}}
						/>
					)}
					{channel.counterparty_node_id && (
						<Section
							name={t('channel_node_id')}
							value={
								<CaptionB ellipsizeMode="middle" numberOfLines={1}>
									{channel.counterparty_node_id}
								</CaptionB>
							}
							onPress={(): void => {
								Clipboard.setString(channel.counterparty_node_id);
								showToast({
									type: 'success',
									title: t('copied'),
									description: channel.counterparty_node_id,
								});
							}}
						/>
					)}
					{channel.closureReason && (
						<Section
							name={t('closure_reason')}
							value={<CaptionB>{channel.closureReason}</CaptionB>}
						/>
					)}
				</View>

				<View style={styles.buttons}>
					{order && (
						<Button
							style={styles.button}
							text={t('support')}
							size="large"
							variant="secondary"
							onPress={(): void => {
								openSupportLink(order);
							}}
						/>
					)}
					{channelIsOpen && (
						<Button
							style={styles.button}
							text={t('close_conn')}
							size="large"
							testID="CloseConnection"
							onPress={(): void =>
								navigation.navigate('CloseConnection', {
									channelId: channel.channel_id,
								})
							}
						/>
					)}
				</View>

				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
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
	channel: {
		paddingBottom: 32,
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	status: {
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	section: {
		marginTop: 32,
	},
	sectionTitle: {
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	sectionRoot: {
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	sectionName: {
		flex: 1,
	},
	sectionValue: {
		flex: 1.5,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		marginTop: 16,
		paddingHorizontal: 16,
		flex: 1,
	},
});

export default memo(ChannelDetails);
