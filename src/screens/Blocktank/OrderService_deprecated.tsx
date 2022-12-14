import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';

import { Text, TextInput, View } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Divider from '../../components/Divider';
import useDisplayValues from '../../hooks/displayValues';
import Button from '../../components/Button';
import { buyChannel, refreshOrder } from '../../store/actions/blocktank';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';
import { claimChannel } from '../../store/actions/lightning';
import Store from '../../store/types';
import SafeAreaView from '../../components/SafeAreaView';

const Order = (props): ReactElement => {
	const { navigation, route } = props;
	const {
		service: {
			product_id,
			description,
			min_channel_size,
			max_channel_size,
			max_chan_expiry,
		},
		existingOrderId,
	} = route.params;

	const [isProcessing, setIsProcessing] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [orderId, setOrderId] = useState<string>(existingOrderId);

	const order = useSelector((state: Store) => {
		if (!orderId) {
			return null;
		}

		return state.blocktank.orders.find((o) => o._id === orderId);
	});

	const [remoteBalance, setRemoteBalance] = useState('0');
	const [localBalance, setLocalBalance] = useState(`${min_channel_size}`);

	const minChannelSizeDisplay = useDisplayValues(min_channel_size);
	const maxChannelSizeDisplay = useDisplayValues(max_channel_size);

	const onOrder = async (): Promise<void> => {
		setIsProcessing(true);
		const res = await buyChannel({
			product_id,
			channel_expiry: max_chan_expiry,
			remote_balance: Number(remoteBalance),
			local_balance: Number(localBalance),
		});

		if (res.isErr()) {
			setIsProcessing(false);
			return showErrorNotification({
				title: 'Order failed',
				message: res.error.message,
			});
		}

		setOrderId(res.value.order_id);
		setIsProcessing(false);
	};

	const goToPayment = (): void => {
		if (order) {
			navigation.navigate('BlocktankPayment', {
				order,
			});
		}
	};

	const onClaimChannel = async (): Promise<void> => {
		if (!order) {
			return;
		}

		setIsProcessing(true);

		const { tag, uri, k1, callback } = order.lnurl_decoded;
		const res = await claimChannel({ tag, uri, k1, callback, domain: '' });
		if (res.isErr()) {
			showErrorNotification({
				title: 'Failed to claim channel',
				message: res.error.message,
			});
		} else {
			showSuccessNotification({ title: 'Channel claimed', message: res.value });
		}

		setIsProcessing(false);
	};

	const onRefreshOrder = useCallback(async (): Promise<void> => {
		if (!orderId) {
			return;
		}

		setIsRefreshing(true);

		const res = await refreshOrder(orderId);
		if (res.isErr()) {
			showErrorNotification({
				title: 'Failed to refresh order',
				message: res.error.message,
			});
		}

		setIsRefreshing(false);
	}, [orderId]);

	useEffect(() => {
		onRefreshOrder().catch();
	}, [onRefreshOrder]);

	const showPayButton = order && order?.state === 0;
	const showClaimButton = order && order?.state === 100;

	return (
		<SafeAreaView>
			<NavigationHeader title={description} />
			<View style={styles.content}>
				{order ? (
					<View>
						<TouchableOpacity
							onPress={(): void => Clipboard.setString(order?._id)}>
							<Text>Order: {order?._id}</Text>
						</TouchableOpacity>
						<Text>State: {order?.stateMessage}</Text>
					</View>
				) : (
					<View>
						<Text style={styles.price}>
							Min channel size: {minChannelSizeDisplay.bitcoinSymbol}
							{minChannelSizeDisplay.bitcoinFormatted} (
							{minChannelSizeDisplay.fiatSymbol}
							{minChannelSizeDisplay.fiatFormatted})
						</Text>

						<Text style={styles.price}>
							Max channel size: {maxChannelSizeDisplay.bitcoinSymbol}
							{maxChannelSizeDisplay.bitcoinFormatted} (
							{maxChannelSizeDisplay.fiatSymbol}
							{maxChannelSizeDisplay.fiatFormatted})
						</Text>
						<Divider />

						<Text>Can receive</Text>
						<TextInput
							textAlignVertical={'center'}
							underlineColorAndroid="transparent"
							style={styles.textInput}
							placeholder="Can receive"
							autoCapitalize="none"
							autoCompleteType="off"
							keyboardType="number-pad"
							autoCorrect={false}
							onChangeText={setLocalBalance}
							value={localBalance}
						/>

						<Text>Can send</Text>
						<TextInput
							textAlignVertical={'center'}
							underlineColorAndroid="transparent"
							style={styles.textInput}
							placeholder="Can send"
							autoCapitalize="none"
							autoCompleteType="off"
							keyboardType="number-pad"
							autoCorrect={false}
							onChangeText={setRemoteBalance}
							value={remoteBalance}
						/>
					</View>
				)}

				<View style={styles.footer}>
					<Divider />

					{orderId ? (
						<Button
							text={isRefreshing ? 'Refreshing...' : 'Refresh Order'}
							disabled={isRefreshing}
							onPress={onRefreshOrder}
						/>
					) : (
						<Button
							text={isProcessing ? 'Ordering...' : 'Order'}
							disabled={isProcessing}
							onPress={onOrder}
						/>
					)}

					{showPayButton ? (
						<Button
							text={'Pay'}
							disabled={isProcessing}
							onPress={goToPayment}
						/>
					) : null}
					{showClaimButton ? (
						<Button
							text={isProcessing ? 'Claiming...' : 'Claim Channel'}
							disabled={isProcessing}
							onPress={onClaimChannel}
						/>
					) : null}
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingLeft: 20,
		paddingRight: 20,
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	footer: {
		paddingBottom: 20,
	},
	price: {
		marginVertical: 10,
		fontSize: 14,
	},
	textInput: {
		minHeight: 50,
		borderRadius: 5,
		fontWeight: 'bold',
		fontSize: 18,
		textAlign: 'center',
		color: 'gray',
		borderBottomWidth: 1,
		borderColor: 'gray',
		paddingHorizontal: 10,
		backgroundColor: 'white',
		marginVertical: 5,
	},
});

export default Order;
