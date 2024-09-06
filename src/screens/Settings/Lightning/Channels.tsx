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
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';
import { BtOrderState2 } from '@synonymdev/blocktank-lsp-http-client/dist/shared/BtOrderState2';

import { AnimatedView, View as ThemedView } from '../../../styles/components';
import { Caption13Up, BodyMSB } from '../../../styles/text';
import {
	ChevronRight,
	DownArrow,
	UpArrow,
	PlusIcon,
} from '../../../styles/icons';
import useBreakpoints from '../../../styles/breakpoints';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel, {
	TStatus,
} from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import useColors from '../../../hooks/colors';
import { useAppSelector } from '../../../hooks/redux';
import { refreshOrdersList } from '../../../store/utils/blocktank';
import { refreshLdk } from '../../../utils/lightning';
import { showToast } from '../../../utils/notifications';
import {
	useLightningChannelName,
	useLightningBalance,
	useLightningChannelBalance,
} from '../../../hooks/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import {
	closedChannelsSelector,
	openChannelsSelector,
	pendingChannelsSelector,
} from '../../../store/reselect/lightning';
import { zipLogs } from '../../../utils/lightning/logs';
import { SettingsScreenProps } from '../../../navigation/types';
import {
	blocktankOrdersSelector,
	blocktankPaidOrdersSelector,
} from '../../../store/reselect/blocktank';
import { TPaidBlocktankOrders } from '../../../store/types/blocktank';
import { EUnit } from '../../../store/types/wallet';
import { EChannelStatus, TChannel } from '../../../store/types/lightning';

/**
 * Convert pending (non-channel) blocktank orders to (fake) channels.
 * @param {IBtOrder[]} orders
 * @param {TPaidBlocktankOrders} paidOrders
 */
const getPendingBlocktankChannels = (
	orders: IBtOrder[],
	paidOrders: TPaidBlocktankOrders,
): {
	pendingOrders: TChannel[];
	failedOrders: TChannel[];
} => {
	const pendingOrders: TChannel[] = [];
	const failedOrders: TChannel[] = [];

	Object.keys(paidOrders).forEach((orderId) => {
		let order = orders.find((o) => o.id === orderId)!;
		if (!order) {
			return;
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
			counterparty_node_id: '',
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
		const { capacity, spendingTotal, receivingAvailable } =
			useLightningChannelBalance(channel);

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
				activeOpacity={0.7}
				testID="Channel"
				onPress={(): void => onPress(channel)}>
				<View style={styles.nTitle}>
					<BodyMSB
						style={styles.nName}
						color={closed ? 'secondary' : 'white'}
						numberOfLines={1}
						ellipsizeMode="middle">
						{channelName}
					</BodyMSB>
					<ChevronRight color="secondary" height={24} />
				</View>
				<LightningChannel
					capacity={capacity}
					localBalance={spendingTotal}
					remoteBalance={receivingAvailable}
					status={getChannelStatus()}
				/>
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
	const [refreshingLdk, setRefreshingLdk] = useState(false);
	const [showClosed, setShowClosed] = useState(
		route.params?.showClosed ?? false,
	);

	const colors = useColors();
	const br = useBreakpoints();
	const { localBalance, remoteBalance } = useLightningBalance();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const blocktankOrders = useAppSelector(blocktankOrdersSelector);
	const paidOrders = useAppSelector(blocktankPaidOrdersSelector);
	const openChannels = useAppSelector(openChannelsSelector);
	const pendingChannels = useAppSelector(pendingChannelsSelector);
	const closedChannels = useAppSelector(closedChannelsSelector);

	const { pendingOrders, failedOrders } = getPendingBlocktankChannels(
		blocktankOrders,
		paidOrders,
	);
	const pendingConnections = [...pendingOrders, ...pendingChannels];

	const handleAdd = useCallback((): void => {
		navigation.navigate('TransferRoot', { screen: 'Funding' });
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

	const onRefreshLdk = useCallback(async (): Promise<void> => {
		setRefreshingLdk(true);
		await refreshLdk({ selectedWallet, selectedNetwork });
		await refreshOrdersList();
		setRefreshingLdk(false);
	}, [selectedNetwork, selectedWallet]);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('connections')}
				onActionPress={handleAdd}
				actionIcon={<PlusIcon width={24} height={24} />}
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
						<Caption13Up color="secondary">{t('spending_label')}</Caption13Up>
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
						<Caption13Up color="secondary">{t('receiving_label')}</Caption13Up>
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
						<Caption13Up color="secondary" style={styles.sectionTitle}>
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
						<Caption13Up color="secondary" style={styles.sectionTitle}>
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
								<Caption13Up color="secondary" style={styles.sectionTitle}>
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
								<Caption13Up color="secondary" style={styles.sectionTitle}>
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
						size="large"
						variant="tertiary"
						onPress={(): void => setShowClosed((prevState) => !prevState)}
					/>
				)}

				<View style={[styles.buttons, br.up('sm') && styles.buttonsRow]}>
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
	buttons: {
		marginTop: 'auto',
		gap: 16,
	},
	buttonsRow: {
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
});

export default memo(Channels);
