import React, { ReactElement, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import {
	StyleSheet,
	View,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';

import { View as ThemedView } from '../../../styles/components';
import { Caption13Up, Caption13M, Text01M } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import Money from '../../../components/Money';
import { showSuccessNotification } from '../../../utils/notifications';
import Store from '../../../store/types';
import { getBlockExplorerLink } from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { SettingsScreenProps } from '../../../navigation/types';
import { getIcon } from './index';
import { blocktankPaidOrderSelector } from '../../../store/reselect/blocktank';
import { createSupportLink } from '../../../utils/support';

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

const BlocktankOrderDetails = ({
	navigation,
	route,
}: SettingsScreenProps<'BlocktankOrderDetails'>): ReactElement => {
	const { blocktankOrder } = route.params;

	const paidOrderTxid = useSelector((state: Store) =>
		blocktankPaidOrderSelector(state, blocktankOrder._id),
	);

	const Icon = useMemo(
		() => getIcon(blocktankOrder.state),
		[blocktankOrder?.state],
	);

	if (!blocktankOrder) {
		return (
			<ThemedView style={styles.root}>
				<SafeAreaInsets type="top" />
				<NavigationHeader title="Order details" />
				<ScrollView contentContainerStyle={styles.content}>
					<ActivityIndicator size="small" />
				</ScrollView>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Order details"
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Icon />
					<View>
						<Text01M>{blocktankOrder.stateMessage}</Text01M>
						<View style={styles.headerIdDate}>
							<Caption13M color="gray1">{blocktankOrder._id}</Caption13M>
							<Caption13M color="gray1">
								{new Date(blocktankOrder.created_at).toLocaleString(undefined, {
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: 'numeric',
								})}
							</Caption13M>
						</View>
					</View>
				</View>

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">BALANCE</Caption13Up>
				</View>
				<Section
					name="Receiving balance"
					value={
						<Money
							sats={blocktankOrder.local_balance}
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
							sats={blocktankOrder.remote_balance}
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

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">Info</Caption13Up>
				</View>
				<Section
					name="Created on"
					value={
						<Caption13M>
							{new Date(blocktankOrder.created_at).toLocaleString(undefined, {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
								hour: 'numeric',
								minute: 'numeric',
							})}
						</Caption13M>
					}
				/>
				<Section
					name="Order ID"
					value={
						<Caption13M ellipsizeMode="middle" numberOfLines={1}>
							{blocktankOrder._id}
						</Caption13M>
					}
					onPress={(): void => {
						Clipboard.setString(blocktankOrder._id);
						showSuccessNotification({
							title: 'Copied Order ID to Clipboard',
							message: blocktankOrder._id,
						});
					}}
				/>
				{paidOrderTxid !== '' && (
					<Section
						name="Transaction ID"
						value={
							<Caption13M ellipsizeMode="middle" numberOfLines={1}>
								{paidOrderTxid}
							</Caption13M>
						}
						onPress={(): void => {
							const blockExplorerUrl = getBlockExplorerLink(paidOrderTxid);
							openURL(blockExplorerUrl).then();
						}}
					/>
				)}

				<View style={styles.buttons}>
					<Button
						text="Contact Support"
						size="large"
						onPress={async (): Promise<void> => {
							await openURL(
								await createSupportLink(
									blocktankOrder._id,
									`Transaction ID: ${paidOrderTxid}`,
								),
							);
						}}
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
		paddingBottom: 16,
	},
	content: {
		paddingHorizontal: 16,
		flexGrow: 1,
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
	buttons: {
		flex: 1,
		justifyContent: 'flex-end',
		marginTop: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerIdDate: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		flex: 1,
	},
});

export default memo(BlocktankOrderDetails);
