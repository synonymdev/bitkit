import React, { ReactElement, memo, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSelector } from 'react-redux';
import { SvgProps } from 'react-native-svg';
import { IGetOrderResponse } from '@synonymdev/blocktank-client';

import { View as ThemedView } from '../../../styles/components';
import { Caption13Up, Caption13M, Text01M } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import {
	useLightningChannelBalance,
	useLightningChannelName,
} from '../../../hooks/lightning';
import { showSuccessNotification } from '../../../utils/notifications';
import { getTransactions } from '../../../utils/wallet/electrum';
import { getBlockExplorerLink } from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { createSupportLink } from '../../../utils/support';
import Store from '../../../store/types';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { getStateMessage } from '../../../utils/blocktank';
import {
	ArrowCounterClock,
	Checkmark,
	ClockIcon,
	LightningIcon,
	TimerSpeedIcon,
	XIcon,
} from '../../../styles/icons';
import type { SettingsScreenProps } from '../../../navigation/types';

export const getStatus = (state: number): React.FC<SvgProps> => {
	// possible order states
	// https://github.com/synonymdev/blocktank-server/blob/master/src/Orders/Order.js
	switch (state) {
		case 0:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<ClockIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 100:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<Checkmark color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 150:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<ArrowCounterClock color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 200:
		case 300:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="yellow16" style={styles.statusIcon}>
						<ClockIcon color="yellow" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 350:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<ClockIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 400:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="red16" style={styles.statusIcon}>
						<XIcon color="red" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 410:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="red16" style={styles.statusIcon}>
						<TimerSpeedIcon color="red" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 450:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="white1" style={styles.statusIcon}>
						<LightningIcon color="gray1" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
				</View>
			);
		case 500:
			return (): ReactElement => (
				<View style={styles.statusRow}>
					<ThemedView color="green16" style={styles.statusIcon}>
						<LightningIcon color="green" width={16} height={16} />
					</ThemedView>
					<Text01M>{getStateMessage(state)}</Text01M>
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
		onPress,
	}: {
		name: string;
		value: ReactElement;
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
				<View style={styles.sectionValue}>{value}</View>
			</TouchableOpacity>
		);
	},
);

const ChannelDetails = ({
	navigation,
	route,
}: SettingsScreenProps<'ChannelDetails'>): ReactElement => {
	const { channel } = route.params;

	const name = useLightningChannelName(channel);
	const { spendingAvailable, receivingAvailable, capacity } =
		useLightningChannelBalance(channel);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const [txTime, setTxTime] = useState<undefined | string>();

	const blocktankOrders = useSelector((state: Store) => {
		return state.blocktank.orders;
	});

	const blocktankOrder = Object.values(blocktankOrders).find((order) => {
		return order.channel_open_tx?.transaction_id === channel.funding_txid;
	});

	// TODO: show status for non-blocktank channels
	const Status = useMemo(() => {
		if (blocktankOrder) {
			return getStatus(blocktankOrder.state);
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
			const formattedDate = new Date(timestamp * 1000).toLocaleString(
				undefined,
				{
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					hour12: false,
				},
			);

			setTxTime(formattedDate);
		});
	}, [selectedNetwork, channel.funding_txid]);

	const openSupportLink = async (order: IGetOrderResponse): Promise<void> => {
		await openURL(
			await createSupportLink(
				order._id,
				`Transaction ID: ${order.channel_open_tx?.transaction_id}`,
			),
		);
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={name}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.channel}>
					<LightningChannel
						channel={channel}
						pending={channel.is_channel_ready && !channel.is_usable}
						closed={!channel.is_channel_ready}
					/>
				</View>

				{blocktankOrder && (
					<View style={styles.status}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="gray1">Status</Caption13Up>
						</View>
						{Status && <Status />}
					</View>
				)}

				{blocktankOrder && (
					<View style={styles.section}>
						<View style={styles.sectionTitle}>
							<Caption13Up color="gray1">Order Details</Caption13Up>
						</View>
						<Section
							name="Order"
							value={<Caption13M>{blocktankOrder._id}</Caption13M>}
						/>
						<Section
							name="Created on"
							value={
								<Caption13M>
									{new Date(blocktankOrder.created_at).toLocaleString(
										undefined,
										{
											year: 'numeric',
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: 'numeric',
											hour12: false,
										},
									)}
								</Caption13M>
							}
						/>
						{channel.funding_txid && (
							<Section
								name="Transaction"
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
							name="Order fee"
							value={
								<Money
									sats={blocktankOrder.price}
									size="caption13M"
									symbol={true}
									color="white"
									unit="satoshi"
								/>
							}
						/>
					</View>
				)}

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">Balance</Caption13Up>
					</View>
					<Section
						name="Receiving capacity"
						value={
							<Money
								sats={receivingAvailable}
								size="caption13M"
								symbol={true}
								color="white"
								unit="satoshi"
							/>
						}
					/>
					<Section
						name="Spending balance"
						value={
							<Money
								sats={spendingAvailable}
								size="caption13M"
								symbol={true}
								color="white"
								unit="satoshi"
							/>
						}
					/>
					<Section
						name="Reserve balance"
						value={
							<Money
								sats={Number(channel.unspendable_punishment_reserve)}
								size="caption13M"
								symbol={true}
								color="white"
								unit="satoshi"
							/>
						}
					/>
					<Section
						name="Total channel size"
						value={
							<Money
								sats={capacity}
								size="caption13M"
								symbol={true}
								color="white"
								unit="satoshi"
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
								unit="satoshi"
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
								unit="satoshi"
							/>
						}
					/>
				</View> */}

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">Other</Caption13Up>
					</View>
					{txTime && (
						<Section
							name="Opened on"
							value={<Caption13M>{txTime}</Caption13M>}
						/>
					)}
					<Section
						name="Node ID"
						value={
							<Caption13M ellipsizeMode="middle" numberOfLines={1}>
								{channel.counterparty_node_id}
							</Caption13M>
						}
						onPress={(): void => {
							Clipboard.setString(channel.counterparty_node_id);
							showSuccessNotification({
								title: 'Copied Counterparty Node ID to Clipboard',
								message: channel.counterparty_node_id,
							});
						}}
					/>
				</View>

				<View style={styles.buttons}>
					{blocktankOrder && (
						<>
							<Button
								style={styles.button}
								text="Support"
								size="large"
								variant="secondary"
								onPress={(): void => {
									openSupportLink(blocktankOrder);
								}}
							/>
							<View style={styles.divider} />
						</>
					)}
					<Button
						style={styles.button}
						text="Close Connection"
						size="large"
						onPress={(): void =>
							navigation.navigate('CloseConnection', {
								channelId: channel.channel_id,
							})
						}
					/>
				</View>

				<SafeAreaInsets type="bottom" />
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
