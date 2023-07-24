import React, { ReactElement, memo, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSelector } from 'react-redux';
import { SvgProps } from 'react-native-svg';
import { IGetOrderResponse } from '@synonymdev/blocktank-client';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { Caption13Up, Caption13M, Text01M } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel, {
	TStatus,
} from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import { useAppSelector } from '../../../hooks/redux';
import { usePaidBlocktankOrders } from '../../../hooks/blocktank';
import {
	useLightningChannelBalance,
	useLightningChannelName,
} from '../../../hooks/lightning';
import { showToast } from '../../../utils/notifications';
import { getTransactions } from '../../../utils/wallet/electrum';
import { getBlockExplorerLink } from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { createOrderSupportLink } from '../../../utils/support';
import Store from '../../../store/types';
import { EUnit } from '../../../store/types/wallet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import {
	channelIsOpenSelector,
	openChannelIdsSelector,
} from '../../../store/reselect/lightning';
import { getStateMessage } from '../../../utils/blocktank';
import {
	ArrowCounterClock,
	Checkmark,
	ClockIcon,
	HourglassSimpleIcon,
	LightningIcon,
	TimerSpeedIcon,
	XIcon,
} from '../../../styles/icons';
import type { SettingsScreenProps } from '../../../navigation/types';
import { i18nTime } from '../../../utils/i18n';

export const getOrderStatus = (state: number): React.FC<SvgProps> => {
	// possible order states
	// https://github.com/synonymdev/blocktank-server/blob/master/src/Orders/Order.js
	switch (state) {
		case 0:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="purple16" style={styles.statusIcon}>
						<ClockIcon color="purple" width={16} height={16} />
					</ThemedView>
					<Text01M color="purple">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 100:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="purple16" style={styles.statusIcon}>
						<Checkmark color="purple" width={16} height={16} />
					</ThemedView>
					<Text01M color="purple">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 150:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<ArrowCounterClock color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M color="gray1">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 200:
		case 300:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="purple16" style={styles.statusIcon}>
						<HourglassSimpleIcon color="purple" width={16} height={16} />
					</ThemedView>
					<Text01M color="purple">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 350:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<HourglassSimpleIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M color="gray1">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 400:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="red16" style={styles.statusIcon}>
						<XIcon color="red" width={16} height={16} />
					</ThemedView>
					<Text01M color="red">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 410:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="red16" style={styles.statusIcon}>
						<TimerSpeedIcon color="red" width={16} height={16} />
					</ThemedView>
					<Text01M color="red">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 450:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<LightningIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M color="gray1">{getStateMessage(state)}</Text01M>
				</View>
			);
		case 500:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="green16" style={styles.statusIcon}>
						<LightningIcon color="green" width={16} height={16} />
					</ThemedView>
					<Text01M color="green">{getStateMessage(state)}</Text01M>
				</View>
			);
		default:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<LightningIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
	}
};

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
				activeOpacity={onPress ? 0.5 : 1}
				onPress={onPress}
				style={styles.sectionRoot}>
				<View style={styles.sectionName}>
					<Caption13M>{name}</Caption13M>
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

	const [txTime, setTxTime] = useState<string>();
	const { spendingAvailable, receivingAvailable, capacity } =
		useLightningChannelBalance(channel);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const enableDevOptions = useSelector(enableDevOptionsSelector);
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

	const openChannelIds = useSelector((state: Store) => {
		return openChannelIdsSelector(state, selectedWallet, selectedNetwork);
	});

	const channelIsOpen = useAppSelector((state) => {
		return channelIsOpenSelector(
			state,
			selectedWallet,
			selectedNetwork,
			channel.channel_id,
		);
	});

	// TODO: show status for non-blocktank channels
	const Status = useMemo(() => {
		if (blocktankOrder) {
			return getOrderStatus(blocktankOrder.state);
		}

		return null;
	}, [blocktankOrder]);

	useEffect(() => {
		if (!channel.funding_txid) {
			return;
		}
		getTransactions({
			txHashes: [{ tx_hash: channel.funding_txid }],
			selectedNetwork,
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

	const openSupportLink = async (order: IGetOrderResponse): Promise<void> => {
		const link = await createOrderSupportLink(
			order._id,
			`Transaction ID: ${order.channel_open_tx?.transaction_id}`,
		);
		await openURL(link);
	};

	const getChannelStatus = (): TStatus => {
		if (blocktankOrder) {
			if ([0, 100, 150, 200].includes(blocktankOrder.state)) {
				return 'pending';
			}
			if ([400, 410].includes(blocktankOrder.state)) {
				return 'closed';
			}
		}

		if (openChannelIds.includes(channel.channel_id)) {
			return channel.is_usable ? 'open' : 'pending';
		}

		return 'closed';
	};

	let channelCloseTime: string | undefined;
	if (blocktankOrder?.channel_close_tx) {
		channelCloseTime = tTime('dateTime', {
			v: new Date(blocktankOrder.channel_close_tx.ts),
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

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={channelName}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<ScrollView
				contentContainerStyle={styles.content}
				testID="ChannelScrollView">
				<View style={styles.channel}>
					<LightningChannel channel={channel} status={getChannelStatus()} />
				</View>

				{blocktankOrder && (
					<View style={styles.status}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="gray1">{t('status')}</Caption13Up>
						</View>
						{Status && <Status />}
					</View>
				)}

				{blocktankOrder && (
					<View style={styles.section}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="gray1">{t('order_details')}</Caption13Up>
						</View>
						<Section
							name={t('order')}
							value={<Caption13M>{blocktankOrder._id}</Caption13M>}
							onPress={(): void => Clipboard.setString(blocktankOrder._id)}
						/>
						<Section
							name={t('created_on')}
							value={
								<Caption13M>
									{tTime('dateTime', {
										v: new Date(blocktankOrder.created_at),
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
								</Caption13M>
							}
						/>
						{channel.funding_txid && (
							<Section
								name={t('transaction')}
								value={
									<Caption13M ellipsizeMode="middle" numberOfLines={1}>
										{channel.funding_txid}
									</Caption13M>
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
						<Section
							name={t('order_fee')}
							value={
								<Money
									sats={blocktankOrder.price}
									size="caption13M"
									symbol={true}
									color="white"
									unit={EUnit.satoshi}
								/>
							}
						/>
					</View>
				)}

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">{t('balance')}</Caption13Up>
					</View>
					<Section
						name={t('receiving_label')}
						value={
							<Money
								sats={receivingAvailable}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EUnit.satoshi}
							/>
						}
					/>
					<Section
						name={t('spending_label')}
						value={
							<Money
								sats={spendingAvailable}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EUnit.satoshi}
							/>
						}
					/>
					<Section
						name={t('reserve_balance')}
						value={
							<Money
								sats={Number(channel.unspendable_punishment_reserve)}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EUnit.satoshi}
							/>
						}
					/>
					<Section
						name={t('total_size')}
						testID="TotalSize"
						value={
							<Money
								sats={capacity}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EUnit.satoshi}
							/>
						}
					/>
				</View>

				{/* TODO: show fees */}
				{/* <View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">Fees</Caption13Up>
					</View>
					<Section
						name="Spending base fee"
						value={
							<Money
								sats={123}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EBitcoinUnit.satoshi}
							/>
						}
					/>
					<Section
						name="Receiving base fee"
						value={
							<Money
								sats={123}
								size="caption13M"
								symbol={true}
								color="white"
								unit={EBitcoinUnit.satoshi}
							/>
						}
					/>
				</View> */}

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">{t('other')}</Caption13Up>
					</View>
					{txTime && (
						<Section
							name={t('opened_on')}
							value={<Caption13M>{txTime}</Caption13M>}
						/>
					)}
					{channelCloseTime && (
						<Section
							name={t('closed_on')}
							value={<Caption13M>{channelCloseTime}</Caption13M>}
						/>
					)}
					<Section
						name={t('channel_node_id')}
						value={
							<Caption13M ellipsizeMode="middle" numberOfLines={1}>
								{channel.counterparty_node_id}
							</Caption13M>
						}
						onPress={(): void => {
							Clipboard.setString(channel.counterparty_node_id);
							showToast({
								type: 'success',
								title: t('copied_couterparty'),
								description: channel.counterparty_node_id,
							});
						}}
					/>
				</View>

				{enableDevOptions && (
					<View style={styles.section}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="gray1">{t('debug')}</Caption13Up>
						</View>
						{blocktankOrder?.order_expiry && (
							<Section
								name="Order Expiry"
								value={
									<Caption13M>
										{new Date(blocktankOrder.order_expiry).toLocaleString()}
									</Caption13M>
								}
							/>
						)}
						<Section
							name={t('is_usable')}
							value={
								<Caption13M>{t(channel.is_usable ? 'yes' : 'no')}</Caption13M>
							}
						/>
						<Section
							name={t('is_ready')}
							testID={channel.is_channel_ready ? 'IsReadyYes' : 'IsReadyNo'}
							value={
								<Caption13M>
									{t(channel.is_channel_ready ? 'yes' : 'no')}
								</Caption13M>
							}
						/>
					</View>
				)}

				<View style={styles.buttons}>
					{blocktankOrder && (
						<>
							<Button
								style={styles.button}
								text={t('support')}
								size="large"
								variant="secondary"
								onPress={(): void => {
									openSupportLink(blocktankOrder);
								}}
							/>
							<View style={styles.divider} />
						</>
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
		paddingTop: 16,
		paddingBottom: 32,
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	status: {
		marginBottom: 16,
	},
	statusRow: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 16,
	},
	section: {
		marginTop: 16,
	},
	sectionTitle: {
		height: 30,
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
	},
	button: {
		marginTop: 16,
		paddingHorizontal: 16,
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(ChannelDetails);
