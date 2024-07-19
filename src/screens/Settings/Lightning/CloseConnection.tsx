import React, { ReactElement, memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { BodyMB, BodyM } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/buttons/Button';
import { useAppSelector } from '../../../hooks/redux';
import { showToast } from '../../../utils/notifications';
import { closeChannel, refreshLdk } from '../../../utils/lightning';
import { channelSelector } from '../../../store/reselect/lightning';

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
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const channel = useAppSelector((state) => {
		return channelSelector(state, channelId);
	});

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
			showToast({
				type: 'warning',
				title: t('close_error'),
				description: t('close_error_msg'),
			});
			return;
		}

		showToast({
			type: 'success',
			title: t('close_success_title'),
			description: t('close_success_msg'),
		});

		navigation.navigate('Channels');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('close_conn')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content}>
				<BodyM color="secondary">
					<Trans
						t={t}
						i18nKey="close_text"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('cancel')}
						size="large"
						variant="secondary"
						onPress={navigation.goBack}
					/>
					<Button
						style={styles.button}
						text={t('close_button')}
						testID="CloseConnectionButton"
						size="large"
						loading={loading}
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(CloseConnection);
