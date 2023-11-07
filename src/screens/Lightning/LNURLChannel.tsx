import React, { ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Caption13M, Caption13Up, Display, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import { ellipsis } from '../../utils/helpers';
import type { LightningScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import Divider from '../../components/Divider';
import Button from '../../components/Button';
import { handleLnurlChannel } from '../../utils/lnurl';

const LNURLChannel = ({
	navigation,
	route,
}: LightningScreenProps<'LNURLChannel'>): ReactElement => {
	const { cParams } = route.params;
	const { t } = useTranslation('other');
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const [loading, setLoading] = useState(false);

	const [node, host, port] = useMemo(() => {
		const [_node, other] = cParams.uri.split('@');
		const [_host, _port] = other.split(':');
		return [_node, _host, _port];
	}, [cParams.uri]);

	const handleConnect = async (): Promise<void> => {
		setLoading(true);

		const res = await handleLnurlChannel({
			params: cParams,
			selectedWallet,
			selectedNetwork,
		});
		if (res.isErr()) {
			setLoading(false);
			return;
		}
		setLoading(false);
		navigation.navigate('LNURLChannelSuccess');
	};

	const handleCancel = (): void => {
		navigation.goBack();
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('lnurl_channel_header')}
				onClosePress={handleCancel}
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple" style={styles.title}>
					{t('lnurl_channel_title')}
				</Display>
				<Text01S color="gray1">{t('lnurl_channel_message')}</Text01S>
				<Caption13Up color="gray1" style={styles.lsp}>
					{t('lnurl_channel_lsp')}
				</Caption13Up>
				<View style={styles.row}>
					<Caption13M>{t('lnurl_channel_node')}</Caption13M>
					<Caption13M>{ellipsis(node, 32)}</Caption13M>
				</View>
				<Divider />
				<View style={styles.row}>
					<Caption13M>{t('lnurl_channel_host')}</Caption13M>
					<Caption13M>{host}</Caption13M>
				</View>
				<Divider />
				<View style={styles.row}>
					<Caption13M>{t('lnurl_channel_port')}</Caption13M>
					<Caption13M>{port}</Caption13M>
				</View>
				<Divider />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					variant="secondary"
					size="large"
					text={t('cancel')}
					onPress={handleCancel}
				/>
				<View style={styles.divider} />
				<Button
					style={styles.button}
					size="large"
					text={t('common:connect')}
					onPress={handleConnect}
					loading={loading}
					testID="ConnectButton"
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 8,
	},
	lsp: {
		marginTop: 48,
		marginBottom: 32,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		paddingHorizontal: 16,
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default LNURLChannel;
