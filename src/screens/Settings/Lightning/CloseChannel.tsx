import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeChannel, refreshLdk } from '../../../utils/lightning';
import {
	useLightningChannelData,
	useLightningChannelName,
} from '../../../hooks/lightning';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import type { SettingsScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const imageSrc = require('../../../assets/illustrations/switch.png');

const CloseChannel = ({
	route,
	navigation,
}: SettingsScreenProps<'CloseConnection'>): ReactElement => {
	const { channelId } = route.params;
	const [loading, setLoading] = useState<boolean>(false);

	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const channel = useLightningChannelData(channelId);
	const name = useLightningChannelName(channelId);

	const onContinue = async (): Promise<void> => {
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
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Are you sure?" />
			<View style={styles.content}>
				<Text01S color="gray1">
					If you close this Lightning connection the spending balance will be
					transfered to your savings balance (minus closing fees).
				</Text01S>

				<GlowImage image={imageSrc} imageSize={200} glowColor="red" />

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text="Cancel"
						size="large"
						variant="secondary"
						onPress={navigation.goBack}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text="Close"
						size="large"
						loading={loading}
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	buttons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(CloseChannel);
