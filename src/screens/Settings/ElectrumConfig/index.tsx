import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { err, ok, Result } from '@synonymdev/result';
import Url from 'url-parse';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash.isequal';

import { View, TextInput, ScrollView } from '../../../styles/components';
import { Text01S, Caption13Up } from '../../../styles/text';
import { ScanIcon } from '../../../styles/icons';
import { addElectrumPeer } from '../../../store/actions/settings';
import { TProtocol } from '../../../store/types/settings';
import { updateUi } from '../../../store/actions/ui';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { customElectrumPeersSelector } from '../../../store/reselect/settings';
import Store from '../../../store/types';
import { origCustomElectrumPeers } from '../../../store/shapes/settings';
import { connectToElectrum } from '../../../utils/wallet/electrum';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { RadioButtonGroup } from '../../../components/RadioButton';
import Button from '../../../components/Button';
import {
	defaultElectrumPorts,
	getDefaultPort,
	getProtocolForPort,
} from '../../../utils/electrum';
import { showToast } from '../../../utils/notifications';
import { getConnectedPeer, IPeerData } from '../../../utils/wallet/electrum';
import type { SettingsScreenProps } from '../../../navigation/types';

type RadioButtonItem = { label: string; value: TProtocol };

const radioButtons: RadioButtonItem[] = [
	{ label: 'TCP', value: 'tcp' },
	{ label: 'TLS', value: 'ssl' },
];

const isValidURL = (data: string): boolean => {
	const pattern = new RegExp(
		'^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // IP (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*', // port and path
		'i',
	);

	// wave through everything 'localhost' for development
	if (__DEV__ && data.includes('localhost')) {
		return true;
	}

	return !!pattern.test(data);
};

const validateInput = (
	{ host, port }: { host: string; port: string },
	t: (error: string) => void,
): Result<string> => {
	//Ensure the user passed in a host & port to test.
	let error;
	if (host === '' && port === '') {
		error = t('es.error_host_port');
	} else if (host === '') {
		error = t('es.error_host');
	} else if (port === '') {
		error = t('es.error_port');
	} else if (isNaN(Number(port))) {
		error = t('es.error_port_invalid');
	}

	const url = `${host}:${port}`;
	if (!isValidURL(url)) {
		error = t('es.error_invalid_http');
	}

	if (error) {
		return err(error);
	}
	return ok('');
};

const ElectrumConfig = ({
	navigation,
}: SettingsScreenProps<'ElectrumConfig'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const customElectrumPeers = useSelector((state: Store) =>
		customElectrumPeersSelector(state, selectedNetwork),
	);
	const savedPeer = customElectrumPeers[0];
	const [connectedPeer, setConnectedPeer] = useState<IPeerData>();
	const [loading, setLoading] = useState(false);
	const [host, setHost] = useState(savedPeer.host);
	const [protocol, setProtocol] = useState<TProtocol>(savedPeer.protocol);
	const [port, setPort] = useState<string>(
		savedPeer[savedPeer.protocol].toString(),
	);

	useEffect(() => {
		getAndUpdateConnectedPeer();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getAndUpdateConnectedPeer = async (): Promise<void> => {
		const peerInfo = await getConnectedPeer(selectedNetwork);
		if (peerInfo.isOk()) {
			setConnectedPeer({
				host: peerInfo.value.host,
				port: peerInfo.value.port.toString(),
				protocol: peerInfo.value.protocol,
			});
		} else {
			setConnectedPeer(undefined);
		}
	};

	const connectAndAddPeer = async (peerData: {
		host: string;
		port: string;
		protocol: TProtocol;
	}): Promise<void> => {
		setLoading(true);

		try {
			const validityCheck = validateInput(peerData, t);
			if (validityCheck.isErr()) {
				showToast({
					type: 'error',
					title: t('es.error_peer'),
					description: validityCheck.error.message,
				});
				return;
			}
			const defaultPorts = {
				ssl: getDefaultPort(selectedNetwork, 'ssl'),
				tcp: getDefaultPort(selectedNetwork, 'tcp'),
			};
			const connectData = {
				...defaultPorts,
				host: peerData.host.trim(),
				protocol: peerData.protocol,
				[protocol]: Number(peerData.port),
			};
			const connectResponse = await connectToElectrum({
				selectedNetwork,
				customPeers: [connectData],
			});

			addElectrumPeer({ selectedNetwork, peer: connectData });

			if (connectResponse.isOk()) {
				updateUi({ isConnectedToElectrum: true });
				showToast({
					type: 'success',
					title: t('es.server_updated_title'),
					description: t('es.server_updated_message', { host, port }),
				});
			} else {
				console.log(connectResponse.error.message);
				updateUi({ isConnectedToElectrum: false });
				showToast({
					type: 'error',
					title: t('es.server_error'),
					description: t('es.server_error_description'),
				});
			}
			await getAndUpdateConnectedPeer();
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	const resetToDefault = (): void => {
		const peer = origCustomElectrumPeers[selectedNetwork][0];
		setHost(peer.host);
		setPort(peer[peer.protocol].toString());
		setProtocol(peer.protocol);
	};

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner', { onScan });
	};

	const onScan = (data: string): void => {
		let connectData: IPeerData;

		if (!data.startsWith('http://') && !data.startsWith('https://')) {
			let [_host, _port, shortProtocol] = data.split(':');
			let _protocol: TProtocol = 'tcp';

			if (shortProtocol) {
				// Support Umbrel connection URL format
				_protocol = shortProtocol === 's' ? 'ssl' : 'tcp';
			} else {
				// Prefix protocol for common ports if missing
				_protocol = getProtocolForPort(_port, selectedNetwork);
			}

			connectData = {
				host: _host,
				port: _port,
				protocol: _protocol,
			};
		} else {
			const url = new Url(data);

			connectData = {
				host: url.hostname,
				port: url.port,
				protocol: url.protocol === 'https:' ? 'ssl' : 'tcp',
			};

			// Add default port back in
			// https://github.com/unshiftio/url-parse/issues/132
			if (!url.port) {
				const defaultPort = url.protocol === 'https:' ? '443' : '80';
				connectData.port = defaultPort;
			}
		}

		const validityCheck = validateInput(connectData, t);
		if (validityCheck.isErr()) {
			showToast({
				type: 'error',
				title: t('es.error_peer'),
				description: validityCheck.error.message,
			});
			return;
		}

		// Update form
		setHost(connectData.host);
		setPort(connectData.port);
		setProtocol(connectData.protocol);

		// Try to connect
		connectAndAddPeer(connectData);
	};

	// Compare against the currently connected peer
	const hasEdited = !isEqual({ host, port, protocol }, connectedPeer);

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.electrum_server')}
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<Text01S color="gray1">{t('es.connected_to')}</Text01S>
				<View style={styles.row}>
					<View style={styles.connectedPeer} testID="Status">
						{connectedPeer ? (
							<Text01S color="green" testID="Connected">
								{connectedPeer.host}:{connectedPeer.port}
							</Text01S>
						) : (
							<Text01S color="red" testID="Disconnected">
								{t('es.disconnected')}
							</Text01S>
						)}
					</View>
				</View>

				<Caption13Up color="gray1" style={styles.label}>
					{t('es.host')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={host}
					placeholder="127.0.0.1"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="default"
					autoCorrect={false}
					onChangeText={setHost}
					returnKeyType="done"
					testID="HostInput"
				/>

				<Caption13Up color="gray1" style={styles.label}>
					{t('es.port')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={port.toString()}
					placeholder="50001"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="number-pad"
					autoCorrect={false}
					onChangeText={setPort}
					testID="PortInput"
				/>

				<View
					style={styles.protocol}
					accessibilityLabel={protocol}
					testID="ElectrumProtocol">
					<Caption13Up color="gray1" style={styles.label}>
						{t('es.protocol')}
					</Caption13Up>
					<RadioButtonGroup
						data={radioButtons}
						value={protocol}
						onPress={(value): void => {
							const radioValue = value as TProtocol;
							setProtocol(radioValue);

							// Toggle the port if the protocol changes and the default ports are still set.
							if (!port || defaultElectrumPorts.includes(port.toString())) {
								const defaultPort = getDefaultPort(selectedNetwork, radioValue);
								setPort(defaultPort.toString());
							}
						}}
					/>
				</View>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						onPress={resetToDefault}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('es.button_connect')}
						size="large"
						loading={loading}
						disabled={!hasEdited}
						testID="ConnectToHost"
						onPress={(): void => {
							connectAndAddPeer({ host, port, protocol });
						}}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingBottom: 16,
		justifyContent: 'center',
	},
	label: {
		marginTop: 16,
		marginBottom: 4,
	},
	connectedPeer: {
		flex: 1.5,
	},
	textInput: {
		minHeight: 52,
		marginTop: 5,
	},
	protocol: {
		marginTop: 11,
	},
	buttons: {
		marginTop: 16,
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(ElectrumConfig);
