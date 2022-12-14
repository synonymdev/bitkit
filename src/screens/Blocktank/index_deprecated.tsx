import React, { ReactElement, useEffect, useState } from 'react';
import {
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import { FlatList, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Store from '../../store/types';
import useDisplayValues from '../../hooks/displayValues';
import LightingIcon from '../../assets/lightning-logo.svg';
import { IService } from '@synonymdev/blocktank-client';

import { refreshServiceList } from '../../store/actions/blocktank';
import { updateExchangeRates } from '../../store/actions/wallet';
import { showErrorNotification } from '../../utils/notifications';
import SafeAreaView from '../../components/SafeAreaView';

const ListItem = ({
	item,
	onPress,
}: {
	item: IService;
	onPress: () => void;
}): ReactElement => {
	const { description, min_channel_size, max_channel_size, available } = item;

	const minChannelSizeDisplay = useDisplayValues(min_channel_size);
	const maxChannelSizeDisplay = useDisplayValues(max_channel_size);

	const iconSize = 35;
	let walletIcon = (
		<LightingIcon viewBox="0 0 300 300" height={iconSize} width={iconSize} />
	);

	return (
		<TouchableOpacity style={styles.item} onPress={onPress}>
			<View style={styles.col1}>{walletIcon}</View>

			<View style={styles.col2}>
				<Text>{description}</Text>
				<Text>
					{minChannelSizeDisplay.bitcoinSymbol}
					{minChannelSizeDisplay.bitcoinFormatted} to{' '}
					{maxChannelSizeDisplay.bitcoinSymbol}
					{maxChannelSizeDisplay.bitcoinFormatted}
				</Text>
			</View>

			<View style={styles.col3}>
				<Text>{available ? 'Available ✅' : 'Unavailable ❌'}</Text>
			</View>
		</TouchableOpacity>
	);
};

const BlocktankScreen = ({ navigation }): ReactElement => {
	const { serviceList, orders } = useSelector(
		(state: Store) => state.blocktank,
	);

	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		refreshServiceList().catch(() => {
			showErrorNotification({
				title: 'Update failed',
				message: 'Failed to refresh service list',
			});
		});
	}, []);

	const renderItem = ({ item }: { item: IService }): ReactElement => {
		//If we have an order with state CREATED, OPENING, PAID, URI_SET
		let existingOrderId = '';
		orders.forEach((o) => {
			if (
				o.state === 0 ||
				o.state === 300 ||
				o.state === 100 ||
				o.state === 200
			) {
				existingOrderId = o._id;
			}
		});

		return (
			<ListItem
				key={item.product_id}
				item={item}
				onPress={(): void => {
					if (item.available) {
						navigation.navigate('BlocktankOrder', {
							service: item,
							existingOrderId,
						});
					} else {
						showErrorNotification({
							title: 'Service unavailable',
							message: '',
						});
					}
				}}
			/>
		);
	};

	const onRefresh = async (): Promise<void> => {
		setRefreshing(true);
		//Refresh wallet and then update activity list
		await Promise.all([refreshServiceList(), updateExchangeRates()]);
		setRefreshing(false);
	};

	return (
		<SafeAreaView>
			<NavigationHeader title={'Blocktank'} />

			<Text style={styles.text}>Current orders: {orders.length}</Text>

			<FlatList
				data={serviceList}
				renderItem={renderItem}
				keyExtractor={(item): string => item.product_id}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	text: {
		textAlign: 'center',
	},
	item: {
		padding: 20,
		borderColor: 'gray',
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	col1: {
		flexDirection: 'row',
		flex: 1,
	},
	col2: {
		flexDirection: 'column',
		flex: 5,
	},
	col3: {
		flexDirection: 'column',
		justifyContent: 'flex-end',
		flex: 3,
	},
});

export default BlocktankScreen;
