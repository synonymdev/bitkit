import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { Text01B, Text01S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeChannel, refreshLdk } from '../../../utils/lightning';
import { useLightningChannelName } from '../../../hooks/lightning';
import { channelSelector } from '../../../store/reselect/lightning';
import Store from '../../../store/types';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import type { SettingsScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const imageSrc = require('../../../assets/illustrations/exclamation-mark.png');

const CloseConnection = ({
	route,
	navigation,
}: SettingsScreenProps<'CloseConnection'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { channelId } = route.params;
	const [loading, setLoading] = useState<boolean>(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const channel = useSelector((state: Store) => {
		return channelSelector(state, selectedWallet, selectedNetwork, channelId);
	});
	const name = useLightningChannelName(channel);

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
				title: t('close_error'),
				message: closeResponse.error.message,
			});
			return;
		}

		// TODO: remove and use CloseChannelSuccess bottom-sheet instead
		showSuccessNotification({
			title: t('close_success_title'),
			message: t('close_success_msg', { name }),
		});

		navigation.navigate('Channels');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('close_conn')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content}>
				<Text01S color="gray1">
					<Trans
						t={t}
						i18nKey="close_text"
						components={{
							white: <Text01B color="white" />,
						}}
					/>
				</Text01S>

				<GlowImage image={imageSrc} imageSize={200} glowColor="yellow" />

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('cancel')}
						size="large"
						variant="secondary"
						onPress={navigation.goBack}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('close_button')}
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

export default memo(CloseConnection);
