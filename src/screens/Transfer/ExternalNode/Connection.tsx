import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView, TextInput } from '../../../styles/components';
import { BodyM, Caption13Up, Display } from '../../../styles/text';
import { ClipboardTextIcon } from '../../../styles/icons';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { showToast } from '../../../utils/notifications';
import { addPeer, parseUri } from '../../../utils/lightning';
import { savePeer } from '../../../store/utils/lightning';
import type { TransferScreenProps } from '../../../navigation/types';

const ExternalNode = ({
	navigation,
	route,
}: TransferScreenProps<'ExternalConnection'>): ReactElement => {
	const peer = route.params?.peer ?? '';
	const { t } = useTranslation('lightning');
	const [loading, setLoading] = useState(false);
	const [nodeId, setNodeId] = useState('');
	const [host, setHost] = useState('');
	const [port, setPort] = useState('');

	// When coming from the main scanner, the data will be passed to this screen
	useEffect(() => {
		if (peer) {
			const result = parseUri(peer);
			if (result.isOk()) {
				const info = result.value;
				setNodeId(info.publicKey);
				setHost(info.ip);
				setPort(info.port.toString());
			}
		}
		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner');
	};

	const onPaste = async (): Promise<void> => {
		const clipboardData = await Clipboard.getString();

		const result = parseUri(clipboardData);
		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('error_add_uri'),
				description: result.error.message,
			});
		} else {
			// Update form
			const info = result.value;
			setNodeId(info.publicKey);
			setHost(info.ip);
			setPort(info.port.toString());
		}
	};

	const onContinue = async (): Promise<void> => {
		setLoading(true);
		const info = `${nodeId}@${host}:${port}`;
		const addPeerRes = await addPeer({ peer: info, timeout: 5000 });
		if (addPeerRes.isErr()) {
			showToast({
				type: 'error',
				title: t('error_add_title'),
				description: addPeerRes.error.message,
			});
			return;
		}
		const savePeerRes = savePeer({ peer: info });
		if (savePeerRes.isErr()) {
			showToast({
				type: 'error',
				title: t('error_save_title'),
				description: savePeerRes.error.message,
			});
			return;
		}
		setLoading(false);
		navigation.navigate('ExternalAmount', { nodeId });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('external.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content} testID="ExternalNode">
				<Display>
					<Trans
						t={t}
						i18nKey="external_manual.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM style={styles.text} color="secondary">
					{t('external_manual.text')}
				</BodyM>

				<Caption13Up style={styles.label} color="secondary">
					{t('external_manual.node_id')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={nodeId.toString()}
					placeholder="00000000000000000000000000000000000000000000000000000000000000"
					textAlignVertical="center"
					multiline={true}
					underlineColorAndroid="transparent"
					returnKeyType="done"
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect={false}
					onChangeText={setNodeId}
					testID="NodeIdInput"
				/>

				<Caption13Up style={styles.label} color="secondary">
					{t('external_manual.host')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={host}
					placeholder="00.00.00.00"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					returnKeyType="done"
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect={false}
					onChangeText={setHost}
					testID="HostInput"
				/>

				<Caption13Up style={styles.label} color="secondary">
					{t('external_manual.port')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={port.toString()}
					placeholder="9735"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					keyboardType="number-pad"
					returnKeyType="done"
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect={false}
					onChangeText={setPort}
					testID="PortInput"
				/>

				<Button
					style={styles.buttonPaste}
					text={t('external_manual.paste')}
					icon={<ClipboardTextIcon width={16} height={16} />}
					testID="ExternalPaste"
					onPress={onPaste}
				/>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('external_manual.scan')}
						variant="secondary"
						size="large"
						testID="ExternalScan"
						onPress={navigateToScanner}
					/>
					<Button
						style={styles.button}
						text={t('continue')}
						size="large"
						loading={loading}
						testID="ExternalContinue"
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
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
	label: {
		marginTop: 16,
		marginBottom: 4,
	},
	textInput: {
		minHeight: 52,
		marginTop: 5,
	},
	buttonPaste: {
		marginTop: 16,
		alignSelf: 'flex-start',
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ExternalNode);
