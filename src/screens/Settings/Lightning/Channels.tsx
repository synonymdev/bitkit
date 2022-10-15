import React, {
	ReactElement,
	memo,
	useState,
	useMemo,
	useCallback,
} from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13Up,
	ChevronRight,
	DownArrow,
	Text01M,
	UpArrow,
	View as ThemedView,
} from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import LightningChannel from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import useColors from '../../../hooks/colors';
import {
	getNodeId,
	payLightningInvoice,
	refreshLdk,
} from '../../../utils/lightning';
import { TChannel } from '@synonymdev/react-native-ldk';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import Clipboard from '@react-native-clipboard/clipboard';
import {
	useLightningChannelName,
	useLightningBalance,
} from '../../../hooks/lightning';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import { createLightningInvoice } from '../../../store/actions/lightning';

const Channel = memo(
	({
		channelId,
		disabled,
		onPress,
	}: {
		channelId: string;
		disabled: boolean;
		onPress: () => void;
	}): ReactElement => {
		const name = useLightningChannelName(channelId);
		return (
			<TouchableOpacity onPress={onPress} style={styles.nRoot}>
				<View style={styles.nTitle}>
					<Text01M>{name}</Text01M>
					<ChevronRight color="gray1" />
				</View>
				<LightningChannel channelId={channelId} disabled={disabled} />
			</TouchableOpacity>
		);
	},
);

const ChannelList = memo(
	({
		channelIds,
		allChannels,
		onChannelPress,
	}: {
		allChannels: { [key: string]: TChannel };
		channelIds: string[];
		onChannelPress: Function;
	}): ReactElement => {
		return (
			<>
				{channelIds.map((channelId) => {
					const channel = allChannels[channelId];
					return (
						<Channel
							key={channelId}
							channelId={channelId}
							disabled={!channel.is_usable}
							onPress={(): void => onChannelPress(channelId)}
						/>
					);
				})}
			</>
		);
	},
);

const Channels = ({ navigation }): ReactElement => {
	const [closed, setClosed] = useState<boolean>(false);
	const [payingInvoice, setPayingInvoice] = useState<boolean>(false);
	const [refreshingWallet, setRefreshingWallet] = useState<boolean>(false);

	const colors = useColors();
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const channels = useSelector(
		(state: Store) =>
			state.lightning?.nodes[selectedWallet]?.channels[selectedNetwork] ?? {},
	);

	const openChannelIds = useSelector(
		(state: Store) =>
			state.lightning?.nodes[selectedWallet]?.openChannelIds[selectedNetwork] ??
			[],
	);

	const { localBalance, remoteBalance } = useLightningBalance(false);

	const openChannels = useMemo(() => {
		return openChannelIds.filter((channelId) => {
			const channel = channels[channelId];
			return channel?.is_channel_ready;
		});
	}, [channels, openChannelIds]);

	const pendingChannels = useMemo(() => {
		return openChannelIds.filter((channelId) => {
			const channel = channels[channelId];
			return !channel?.is_channel_ready;
		});
	}, [channels, openChannelIds]);

	const closedChannels = useMemo(() => {
		const allChannelKeys = Object.keys(channels);
		return allChannelKeys.filter((key) => {
			return !openChannelIds.includes(key);
		});
	}, [channels, openChannelIds]);

	const handleAdd = useCallback((): void => {
		navigation.navigate('LightningRoot', {
			screen: 'Introduction',
		});

		// TODO: Update this view once we enable creating channels with nodes other than Blocktank.
		//navigation.navigate('LightningAddConnection');

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onChannelPress = useCallback((channelId) => {
		navigation.navigate('ChannelDetails', { channelId });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const createInvoice = async (amountSats = 100): Promise<void> => {
		const createPaymentRequest = await createLightningInvoice({
			amountSats,
			description: '',
			expiryDeltaSeconds: 99999,
			selectedNetwork,
			selectedWallet,
		});
		if (createPaymentRequest.isErr()) {
			showErrorNotification({
				title: 'Failed to Create Invoice',
				message: createPaymentRequest.error.message,
			});
			return;
		}
		const { to_str } = createPaymentRequest.value;
		console.log(to_str);
		Clipboard.setString(to_str);
		showSuccessNotification({
			title: 'Copied Invoice to Clipboard',
			message: to_str,
		});
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Lightning connections" onAddPress={handleAdd} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.balances}>
					<View style={styles.balance}>
						<Caption13Up color="gray1">Spending balance</Caption13Up>
						<View style={styles.row}>
							<UpArrow color="purple" width={22} height={22} />
							<Money
								sats={localBalance}
								color="purple"
								size="title"
								unit="satoshi"
							/>
						</View>
					</View>
					<View style={styles.balance}>
						<Caption13Up color="gray1">Receiving capacity</Caption13Up>
						<View style={styles.row}>
							<DownArrow color="white" width={22} height={22} />
							<Money
								sats={remoteBalance}
								color="white"
								size="title"
								unit="satoshi"
							/>
						</View>
					</View>
				</View>

				{pendingChannels.length > 0 && (
					<>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							PENDING CONNECTIONS
						</Caption13Up>
						<ChannelList
							allChannels={channels}
							channelIds={pendingChannels}
							onChannelPress={onChannelPress}
						/>
					</>
				)}

				<Caption13Up color="gray1" style={styles.sectionTitle}>
					OPEN CONNECTIONS
				</Caption13Up>
				<ChannelList
					allChannels={channels}
					channelIds={openChannels}
					onChannelPress={onChannelPress}
				/>

				{closed && (
					<AnimatedView entering={FadeIn} exiting={FadeOut}>
						<Caption13Up color="gray1" style={styles.sectionTitle}>
							Closed connections
						</Caption13Up>
						<ChannelList
							allChannels={channels}
							channelIds={closedChannels}
							onChannelPress={onChannelPress}
						/>
					</AnimatedView>
				)}

				<Caption13Up color="gray1" style={styles.sectionTitle}>
					LDK Dev Testing
				</Caption13Up>
				<Button
					text={'Refresh LDK'}
					loading={refreshingWallet}
					onPress={async (): Promise<void> => {
						setRefreshingWallet(true);
						await Promise.all([
							refreshLdk({ selectedWallet, selectedNetwork }),
						]);
						setRefreshingWallet(false);
					}}
				/>
				<Button
					text={'Get Node ID'}
					onPress={async (): Promise<void> => {
						const nodeId = await getNodeId();
						if (nodeId.isErr()) {
							console.log(nodeId.error.message);
							return;
						}
						console.log(nodeId.value);
						Clipboard.setString(nodeId.value);
						showSuccessNotification({
							title: 'Copied Node ID to Clipboard',
							message: nodeId.value,
						});
					}}
				/>

				{openChannelIds.length > 0 && (
					<>
						{remoteBalance > 100 && (
							<Button
								text={'Create Invoice: 100 sats'}
								onPress={async (): Promise<void> => {
									createInvoice(100).then();
								}}
							/>
						)}
						{remoteBalance > 5000 && (
							<Button
								text={'Create Invoice: 5000 sats'}
								onPress={async (): Promise<void> => {
									createInvoice(5000).then();
								}}
							/>
						)}
						{localBalance > 0 && (
							<>
								<Button
									text={'Pay Invoice From Clipboard'}
									loading={payingInvoice}
									onPress={async (): Promise<void> => {
										setPayingInvoice(true);
										const invoice = await Clipboard.getString();
										if (!invoice) {
											showErrorNotification({
												title: 'No Invoice Detected',
												message:
													'Unable to retrieve anything from the clipboard.',
											});
										}
										const response = await payLightningInvoice(invoice);
										if (response.isErr()) {
											showErrorNotification({
												title: 'Invoice Payment Failed',
												message: response.error.message,
											});
											setPayingInvoice(false);
											return;
										}
										await Promise.all([
											refreshLdk({ selectedWallet, selectedNetwork }),
										]);
										setPayingInvoice(false);
										showSuccessNotification({
											title: 'Invoice Payment Success',
											message: response.value,
										});
									}}
								/>
							</>
						)}
					</>
				)}

				<View style={styles.buttons}>
					{!closed && (
						<Button
							style={styles.button}
							text="Show Closed Connections"
							textStyle={{ color: colors.white8 }}
							size="large"
							variant="transparent"
							onPress={(): void => setClosed((c) => !c)}
						/>
					)}
					<Button
						style={styles.button}
						text="Add New Connection"
						size="large"
						onPress={handleAdd}
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
		justifyContent: 'space-between',
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
	buttons: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	button: {
		marginTop: 8,
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
});

export default memo(Channels);
