import React, { ReactElement, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../../hooks/redux';

import Divider from '../../components/Divider';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { TransferScreenProps } from '../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { View as ThemedView } from '../../styles/components';
import { BodyM, Caption13Up, CaptionB, Display } from '../../styles/text';
import { ellipsis } from '../../utils/helpers';
import { handleLnurlChannel } from '../../utils/lnurl';

const LNURLChannel = ({
	navigation,
	route,
}: TransferScreenProps<'LNURLChannel'>): ReactElement => {
	const { cParams } = route.params;
	const { t } = useTranslation('other');
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
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
		navigation.navigate('ExternalSuccess');
	};

	const onClosePress = (): void => {
		navigation.popTo('Wallet', { screen: 'Wallets' });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('lnurl_channel_header')} />
			<View style={styles.content}>
				<Display style={styles.title}>
					<Trans
						t={t}
						i18nKey="lnurl_channel_title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM color="secondary">{t('lnurl_channel_message')}</BodyM>
				<Caption13Up color="secondary" style={styles.lsp}>
					{t('lnurl_channel_lsp')}
				</Caption13Up>
				<View style={styles.row}>
					<CaptionB>{t('lnurl_channel_node')}</CaptionB>
					<CaptionB>{ellipsis(node, 32)}</CaptionB>
				</View>
				<Divider />
				<View style={styles.row}>
					<CaptionB>{t('lnurl_channel_host')}</CaptionB>
					<CaptionB>{host}</CaptionB>
				</View>
				<Divider />
				<View style={styles.row}>
					<CaptionB>{t('lnurl_channel_port')}</CaptionB>
					<CaptionB>{port}</CaptionB>
				</View>
				<Divider />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					variant="secondary"
					size="large"
					text={t('cancel')}
					onPress={onClosePress}
				/>
				<Button
					style={styles.button}
					size="large"
					text={t('common:connect')}
					loading={loading}
					testID="ConnectButton"
					onPress={handleConnect}
				/>
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
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default LNURLChannel;
