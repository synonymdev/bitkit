import React, { ReactElement, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import {
	StyleSheet,
	View,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Platform,
} from 'react-native';

import { version as appVersion } from '../../../../package.json';
import {
	Caption13Up,
	Caption13M,
	View as ThemedView,
} from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import Money from '../../../components/Money';
import { showSuccessNotification } from '../../../utils/notifications';
import Store from '../../../store/types';
import { getBlockExplorerLink } from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { SettingsScreenProps } from '../../../navigation/types';

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
	route,
}: SettingsScreenProps<'BlocktankOrderDetails'>): ReactElement => {
	const { blocktankOrder } = route.params;

	const paidBlocktankOrders = useSelector(
		(state: Store) => state.blocktank.paidOrders,
	);

	const paidOrderTxid = useMemo(() => {
		if (blocktankOrder._id in paidBlocktankOrders) {
			return paidBlocktankOrders[blocktankOrder._id];
		}
		return '';
	}, [blocktankOrder._id, paidBlocktankOrders]);

	if (!blocktankOrder) {
		return (
			<ThemedView style={styles.root}>
				<SafeAreaInsets type="top" />
				<NavigationHeader title={'Blocktank Order'} />
				<ScrollView contentContainerStyle={styles.content}>
					<ActivityIndicator size="small" />
				</ScrollView>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Blocktank Order" />
			<ScrollView contentContainerStyle={styles.content}>
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
						<Caption13M ellipsizeMode={'middle'} numberOfLines={1}>
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
							<Caption13M ellipsizeMode={'middle'} numberOfLines={1}>
								{paidOrderTxid}
							</Caption13M>
						}
						onPress={(): void => {
							const blockExplorerUrl = getBlockExplorerLink(paidOrderTxid);
							openURL(blockExplorerUrl).then();
						}}
					/>
				)}
				<Section
					name="Status"
					value={
						<Caption13M ellipsizeMode={'middle'} numberOfLines={1}>
							{blocktankOrder.stateMessage}
						</Caption13M>
					}
				/>

				<View style={styles.buttons}>
					<Button
						text="Contact Support"
						size="large"
						onPress={(): void => {
							let mailToStr = `mailto:support@synonym.to?subject=Blocktank Support: ${blocktankOrder._id}&body=Blocktank Order ID: ${blocktankOrder._id}\nPlatform: ${Platform.OS}\nBitkit Version: ${appVersion}`;
							if (paidOrderTxid) {
								mailToStr += `\nTransaction ID: ${paidOrderTxid}`;
							}
							openURL(mailToStr).then();
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
});

export default memo(BlocktankOrderDetails);
