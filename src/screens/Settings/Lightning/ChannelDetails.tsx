import React, { ReactElement, memo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSelector } from 'react-redux';

import {
	Caption13Up,
	Caption13M,
	View as ThemedView,
} from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import {
	useLightningChannelBalance,
	useLightningChannelData,
	useLightningChannelName,
} from '../../../hooks/lightning';
import { showSuccessNotification } from '../../../utils/notifications';
import { ITransaction, ITxHash } from '../../../utils/wallet';
import { getTransactions } from '../../../utils/wallet/electrum';
import Store from '../../../store/types';

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

const ChannelDetails = ({ route, navigation }): ReactElement => {
	const {
		channelId,
	}: {
		channelId: string;
	} = route.params;

	const name = useLightningChannelName(channelId);
	const { spendingAvailable, receivingAvailable, capacity } =
		useLightningChannelBalance(channelId);
	const channel = useLightningChannelData(channelId);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const [txTime, setTxTime] = useState<undefined | string>();

	useEffect(() => {
		if (!channel?.funding_txid) {
			return;
		}
		getTransactions({
			txHashes: [{ tx_hash: channel.funding_txid }],
			selectedNetwork,
		}).then((txResponse) => {
			if (txResponse.isErr()) {
				return;
			}
			const txData: ITransaction<ITxHash>[] = txResponse.value.data;
			if (txData.length === 0) {
				return;
			}
			const data = txData[0].result;
			setTxTime(new Date(data.time * 1000).toLocaleString());
		});
	}, [selectedNetwork, channel?.funding_txid]);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title={name} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.channel}>
					<LightningChannel channelId={channelId} />
				</View>

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">BALANCE</Caption13Up>
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

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">FEES</Caption13Up>
				</View>
				<Section
					name="Spending base fee"
					value={
						<Money
							sats={1}
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
							sats={1}
							size="caption13M"
							symbol={true}
							color="white"
							unit="satoshi"
						/>
					}
				/>

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">Info</Caption13Up>
				</View>
				{txTime && (
					<Section name="Opened on" value={<Caption13M>{txTime}</Caption13M>} />
				)}
				<Section
					name="Node ID"
					value={
						<Caption13M ellipsizeMode={'middle'} numberOfLines={1}>
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

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text="Close Connection"
						size="large"
						onPress={(): void =>
							navigation.navigate('CloseConnection', { channelId })
						}
					/>
					<SafeAreaInsets type="bottom" />
				</View>
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
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	buttons: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	button: {
		marginTop: 8,
	},
	sectionTitle: {
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
});

export default memo(ChannelDetails);
