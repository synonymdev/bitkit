// @ts-nocheck
import React, {
	memo,
	PropsWithChildren,
	ReactElement,
	useMemo,
	useState,
} from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { View } from '../../../styles/components';
import { Text } from '../../../styles/text';
import useDisplayValues from '../../../hooks/displayValues';
import { useAppSelector } from '../../../hooks/redux';
import { channelIsOpenSelector } from '../../../store/reselect/lightning';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Dialog from '../../../components/Dialog';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

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
	} = useMemo(() => channel, [channel]);

	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const isOpen = useAppSelector((state) => {
		return channelIsOpenSelector(
			state,
			selectedWallet,
			selectedNetwork,
			chanId,
		);
	});

	const [showDialog, setShowDialog] = useState(false);

	const capacityDisplay = useDisplayValues(Number(capacity));
	const remoteBalanceDisplay = useDisplayValues(Number(remoteBalance));
	const localBalanceDisplay = useDisplayValues(Number(localBalance));
	const totalSatoshisReceivedDisplay = useDisplayValues(
		Number(totalSatoshisReceived),
	);
	const totalSatoshisSentDisplay = useDisplayValues(Number(totalSatoshisSent));

	const output = useMemo(() => {
		let o = [];
		o.push([['Channel ID', chanId]]);
		o.push(['Active', `${active ? '✅' : '❌'}`]);
		o.push(['Private', `${channelPrivate ? '✅' : '❌'}`]);
		o.push([
			'Capacity',
			`${capacityDisplay.bitcoinSymbol}${capacityDisplay.bitcoinFormatted} (${capacityDisplay.fiatSymbol}${capacityDisplay.fiatFormatted})`,
		]);
		o.push([
			'Uptime',
			new Date(Number(uptime) * 1000).toISOString().substr(11, 8),
		]);
		o.push([
			'Can receive',
			`${remoteBalanceDisplay.bitcoinSymbol}${remoteBalanceDisplay.bitcoinFormatted} (${remoteBalanceDisplay.fiatSymbol}${remoteBalanceDisplay.fiatFormatted})`,
		]);
		o.push([
			'Can send',
			`${localBalanceDisplay.bitcoinSymbol}${localBalanceDisplay.bitcoinFormatted} (${localBalanceDisplay.fiatSymbol}${localBalanceDisplay.fiatFormatted})`,
		]);
		o.push([
			'Total received',
			`${totalSatoshisReceivedDisplay.bitcoinSymbol}${totalSatoshisReceivedDisplay.bitcoinFormatted} (${totalSatoshisReceivedDisplay.fiatSymbol}${totalSatoshisReceivedDisplay.fiatFormatted})`,
		]);
		o.push([
			'Total sent',
			`${totalSatoshisSentDisplay.bitcoinSymbol}${totalSatoshisSentDisplay.bitcoinFormatted} (${totalSatoshisSentDisplay.fiatSymbol}${totalSatoshisSentDisplay.fiatFormatted})`,
		]);
		o.push(['Close address', closeAddress]);
		return o;
	}, [
		active,
		capacityDisplay.bitcoinFormatted,
		capacityDisplay.bitcoinSymbol,
		capacityDisplay.fiatFormatted,
		capacityDisplay.fiatSymbol,
		chanId,
		channelPrivate,
		closeAddress,
		localBalanceDisplay.bitcoinFormatted,
		localBalanceDisplay.bitcoinSymbol,
		localBalanceDisplay.fiatFormatted,
		localBalanceDisplay.fiatSymbol,
		remoteBalanceDisplay.bitcoinFormatted,
		remoteBalanceDisplay.bitcoinSymbol,
		remoteBalanceDisplay.fiatFormatted,
		remoteBalanceDisplay.fiatSymbol,
		totalSatoshisReceivedDisplay.bitcoinFormatted,
		totalSatoshisReceivedDisplay.bitcoinSymbol,
		totalSatoshisReceivedDisplay.fiatFormatted,
		totalSatoshisReceivedDisplay.fiatSymbol,
		totalSatoshisSentDisplay.bitcoinFormatted,
		totalSatoshisSentDisplay.bitcoinSymbol,
		totalSatoshisSentDisplay.fiatFormatted,
		totalSatoshisSentDisplay.fiatSymbol,
		uptime,
	]);

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
