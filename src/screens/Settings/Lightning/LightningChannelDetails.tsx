import React, {
	memo,
	PropsWithChildren,
	ReactElement,
	useMemo,
	useState,
} from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { View, Text } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import useDisplayValues from '../../../hooks/displayValues';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import { useAppSelector } from '../../../hooks/redux';

interface Props extends PropsWithChildren<any> {
	route: { params: { channel: any } };
}

const LightningChannelDetails = (props: Props): ReactElement => {
	const { channel } = props.route.params;
	const {
		chanId,
		active,
		remoteBalance,
		localBalance,
		capacity,
		closeAddress,
		private: channelPrivate,
		totalSatoshisReceived,
		totalSatoshisSent,
		uptime,
	} = channel;

	const selectedWallet = useAppSelector((store) => store.wallet.selectedWallet);
	const selectedNetwork = useAppSelector(
		(store) => store.wallet.selectedNetwork,
	);
	const openChannelIds = useAppSelector(
		(store) =>
			store.lightning.nodes[selectedWallet].openChannelIds[selectedNetwork],
	);

	const isOpen = useMemo(() => {
		return openChannelIds.includes(chanId);
	}, [chanId, openChannelIds]);

	const [showDialog, setShowDialog] = useState(false);

	const capacityDisplay = useDisplayValues(Number(capacity));
	const remoteBalanceDisplay = useDisplayValues(Number(remoteBalance));
	const localBalanceDisplay = useDisplayValues(Number(localBalance));
	const totalSatoshisReceivedDisplay = useDisplayValues(
		Number(totalSatoshisReceived),
	);
	const totalSatoshisSentDisplay = useDisplayValues(Number(totalSatoshisSent));

	let output = [['Channel ID', chanId]];

	output.push(['Active', `${active ? '✅' : '❌'}`]);
	output.push(['Private', `${channelPrivate ? '✅' : '❌'}`]);
	output.push([
		'Capacity',
		`${capacityDisplay.bitcoinSymbol}${capacityDisplay.bitcoinFormatted} (${capacityDisplay.fiatSymbol}${capacityDisplay.fiatFormatted})`,
	]);
	output.push([
		'Uptime',
		new Date(Number(uptime) * 1000).toISOString().substr(11, 8),
	]);
	output.push([
		'Can receive',
		`${remoteBalanceDisplay.bitcoinSymbol}${remoteBalanceDisplay.bitcoinFormatted} (${remoteBalanceDisplay.fiatSymbol}${remoteBalanceDisplay.fiatFormatted})`,
	]);
	output.push([
		'Can send',
		`${localBalanceDisplay.bitcoinSymbol}${localBalanceDisplay.bitcoinFormatted} (${localBalanceDisplay.fiatSymbol}${localBalanceDisplay.fiatFormatted})`,
	]);
	output.push([
		'Total received',
		`${totalSatoshisReceivedDisplay.bitcoinSymbol}${totalSatoshisReceivedDisplay.bitcoinFormatted} (${totalSatoshisReceivedDisplay.fiatSymbol}${totalSatoshisReceivedDisplay.fiatFormatted})`,
	]);
	output.push([
		'Total sent',
		`${totalSatoshisSentDisplay.bitcoinSymbol}${totalSatoshisSentDisplay.bitcoinFormatted} (${totalSatoshisSentDisplay.fiatSymbol}${totalSatoshisSentDisplay.fiatFormatted})`,
	]);
	output.push(['Close address', closeAddress]);

	const onClose = async (): Promise<void> => {
		setShowDialog(true);
	};

	return (
		<View style={styles.container}>
			<NavigationHeader title={'Channel'} />
			<ScrollView>
				<View style={styles.content}>
					{output.map(([title, value]) => (
						<View style={styles.item} key={title}>
							<Text style={styles.itemTitle}>{title}:</Text>
							<Text style={styles.itemValue}>{value}</Text>
						</View>
					))}

					{isOpen && <Button text={'Close Channel'} onPress={onClose} />}
				</View>
			</ScrollView>
			<Dialog
				visible={showDialog}
				title="Close channel"
				description="Are you sure you want to close this channel?"
				confirmText="Yes, close"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					//TODO: Close Channel
					setShowDialog(false);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		margin: 20,
	},
	item: {
		marginBottom: 20,
	},
	itemTitle: {
		fontWeight: 'bold',
		fontSize: 16,
	},
	itemValue: {
		fontWeight: '300',
		marginTop: 5,
		fontSize: 14,
	},
});

export default memo(LightningChannelDetails);
