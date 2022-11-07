import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { Text01S, View as ThemedView } from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { closeChannel, refreshLdk } from '../../../utils/lightning';
import {
	useLightningChannelData,
	useLightningChannelName,
} from '../../../hooks/lightning';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';

const CloseChannel = ({ route, navigation }): ReactElement => {
	const {
		channelId,
	}: {
		channelId: string;
	} = route.params;
	const [loading, setLoading] = useState<boolean>(false);

	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const channel = useLightningChannelData(channelId);
	const name = useLightningChannelName(channelId);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Are you sure?" />
			<View style={styles.content}>
				<View>
					<Text01S color="gray1" style={styles.text}>
						If you close this Lightning connection the spending balance will be
						transfered to your savings balance (minus closing fees).
					</Text01S>
				</View>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="red" />
					<Image
						style={styles.image}
						source={require('../../../assets/illustrations/switch.png')}
					/>
				</View>

				<View>
					<View style={styles.buttons}>
						<Button
							style={styles.button}
							text="Cancel"
							size="large"
							variant="secondary"
							onPress={navigation.goBack}
						/>
						<Button
							style={styles.button}
							text="Close"
							size="large"
							loading={loading}
							onPress={async (): Promise<void> => {
								setLoading(true);
								// Attempt to close the channel.
								const closeResponse = await closeChannel({
									channelId: channel.channel_id,
									counterPartyNodeId: channel.counterparty_node_id,
									force: false,
								});
								// Attempt to refresh LDK again regardless of the channel close response.
								await refreshLdk({ selectedWallet, selectedNetwork });
								setLoading(false);
								// If error, display error notification and return.
								if (closeResponse.isErr()) {
									showErrorNotification({
										title: 'Channel Close Error',
										message: closeResponse.error.message,
									});
									return;
								}
								// If success navigate back to "Channels" and display success notification.
								navigation.navigate('Channels');
								showSuccessNotification({
									title: 'Channel Close Success',
									message: `Successfully closed ${name}`,
								});
							}}
						/>
					</View>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 16,
		marginBottom: 16,
	},
	imageContainer: {
		height: 300,
		width: 300,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		alignSelf: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		height: 200,
		width: 200,
		resizeMode: 'contain',
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: -8,
		marginBottom: 8,
	},
	button: {
		marginHorizontal: 8,
		flex: 1,
	},
});

export default memo(CloseChannel);
