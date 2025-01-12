import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import parseUrl from 'url-parse';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';
import { EProtocol } from 'beignet';

import { View, TextInput, ScrollView } from '../../../styles/components';
import { BodyM, Caption13Up } from '../../../styles/text';
import { ScanIcon } from '../../../styles/icons';
import useBreakpoints from '../../../styles/breakpoints';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { updateUi } from '../../../store/slices/ui';
import { addElectrumPeer } from '../../../store/slices/settings';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { customElectrumPeersSelector } from '../../../store/reselect/settings';
import { defaultElectrumPeer } from '../../../store/shapes/settings';
import { connectToElectrum } from '../../../utils/wallet/electrum';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { RadioButtonGroup } from '../../../components/buttons/RadioButton';
import Button from '../../../components/buttons/Button';
import {
	defaultElectrumPorts,
	getDefaultPort,
	getProtocolForPort,
} from '../../../utils/electrum';
import { showToast } from '../../../utils/notifications';
import { getConnectedPeer, IPeerData } from '../../../utils/wallet/electrum';
import { refreshWallet, rescanAddresses } from '../../../utils/wallet';
import { EAvailableNetwork } from '../../../utils/networks';
import { updateActivityList } from '../../../store/utils/activity';
import { isConnectedToElectrumSelector } from '../../../store/reselect/ui';
import type { SettingsScreenProps } from '../../../navigation/types';

type RadioButtonItem = { label: string; value: EProtocol };

const radioButtons: RadioButtonItem[] = [
	{ label: 'TCP', value: EProtocol.tcp },
	{ label: 'TLS', value: EProtocol.ssl },
];

const isValidURL = (data: string): boolean => {
	// Add 'http://' if the protocol is missing to enable URL parsing
	let normalizedData = data;
	if (!/^https?:\/\//i.test(data)) {
		normalizedData = `http://${data}`;
	}

	try {
		const url = parseUrl(normalizedData);

		// Allow standard domains, custom TLDs like .local, and IPv4 addresses
		const isValidDomainOrIP = !!url.hostname.match(
			/^([a-z\d]([a-z\d-]*[a-z\d])*\.[a-z\d-]+|(\d{1,3}\.){3}\d{1,3})$/i,
		);

		// Always allow .local domains
		if (url.hostname.endsWith('.local')) {
			return true;
		}

		// Allow localhost in development mode
		if (__DEV__ && data.includes('localhost')) {
			return true;
		}

		return isValidDomainOrIP;
	} catch (e) {
		// If URL constructor fails, it's not a valid URL
		return false;
	}
};

const validateInput = (
	{ host, port }: { host: string; port: string },
	t: (error: string) => string,
): Result<string> => {
	//Ensure the user passed in a host & port to test.
	let error = '';
	if (host === '' && port === '') {
		error = t('es.error_host_port');
	} else if (host === '') {
		error = t('es.error_host');
	} else if (port === '') {
		error = t('es.error_port');
	} else if (Number.isNaN(Number(port))) {
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
	const br = useBreakpoints();
	const dispatch = useAppDispatch();
	const isConnectedToElectrum = useAppSelector(isConnectedToElectrumSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const customElectrumPeers = useAppSelector(customElectrumPeersSelector);
	const savedPeer = customElectrumPeers[0];
	const [connectedPeer, setConnectedPeer] = useState<IPeerData>();
	const [loading, setLoading] = useState(false);
	const [host, setHost] = useState(savedPeer.host);
	const [port, setPort] = useState(savedPeer[savedPeer.protocol].toString());
	const [protocol, setProtocol] = useState(savedPeer.protocol);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const getAndUpdateConnectedPeer = async (): Promise<void> => {
			const peerInfo = await getConnectedPeer();
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

		getAndUpdateConnectedPeer();
	}, [isConnectedToElectrum]);

	const connectAndAddPeer = async (peerData: {
		host: string;
		port: string;
		protocol: EProtocol;
	}): Promise<void> => {
		setLoading(true);

		try {
			const validityCheck = validateInput(peerData, t);
			if (validityCheck.isErr()) {
				showToast({
					type: 'warning',
					title: t('es.error_peer'),
					description: validityCheck.error.message,
				});
				return;
			}
			const defaultPorts = {
				ssl: getDefaultPort(selectedNetwork, EProtocol.ssl),
				tcp: getDefaultPort(selectedNetwork, EProtocol.tcp),
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

			dispatch(
				addElectrumPeer({ peer: connectData, network: selectedNetwork }),
			);

			if (connectResponse.isOk()) {
				dispatch(updateUi({ isConnectedToElectrum: true }));
				showToast({
					type: 'success',
					title: t('es.server_updated_title'),
					description: t('es.server_updated_message', { host, port }),
				});
				if (selectedNetwork === EAvailableNetwork.bitcoinRegtest) {
					// Since this is regtest where each network may be different, we need to rescan the addresses and transactions.
					await rescanAddresses({
						shouldClearAddresses: false,
						shouldClearTransactions: true,
					});
					await refreshWallet();
					updateActivityList();
				}
			} else {
				console.log(connectResponse.error.message);
				dispatch(updateUi({ isConnectedToElectrum: false }));
				showToast({
					type: 'warning',
					title: t('es.server_error'),
					description: t('es.server_error_description'),
				});
			}
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	const resetToDefault = (): void => {
		const peer = defaultElectrumPeer[selectedNetwork][0];
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
			const [_host, _port, shortProtocol] = data.split(':');
			let _protocol = EProtocol.tcp;

			if (shortProtocol) {
				// Support Umbrel connection URL format
				_protocol = shortProtocol === 's' ? EProtocol.ssl : EProtocol.tcp;
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
			const url = parseUrl(data);

			connectData = {
				host: url.hostname,
				port: url.port,
				protocol: url.protocol === 'https:' ? EProtocol.ssl : EProtocol.tcp,
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
				type: 'warning',
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
		<View style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.electrum_server')}
				showCloseButton={false}
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<BodyM color="secondary">{t('es.connected_to')}</BodyM>
				<View style={styles.connectedPeer} testID="ElectrumStatus">
					{connectedPeer ? (
						<BodyM color="green" testID="Connected">
							{connectedPeer.host}:{connectedPeer.port}
						</BodyM>
					) : (
						<BodyM color="red" testID="Disconnected">
							{t('es.disconnected')}
						</BodyM>
					)}
				</View>

				<Caption13Up style={styles.label} color="secondary">
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

				<Caption13Up style={styles.label} color="secondary">
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
					<Caption13Up style={styles.label} color="secondary">
						{t('es.protocol')}
					</Caption13Up>
					<RadioButtonGroup
						data={radioButtons}
						value={protocol}
						onPress={(value): void => {
							const radioValue = value as EProtocol;
							setProtocol(radioValue);

							// Toggle the port if the protocol changes and the default ports are still set.
							if (!port || defaultElectrumPorts.includes(port.toString())) {
								const defaultPort = getDefaultPort(selectedNetwork, radioValue);
								setPort(defaultPort.toString());
							}
						}}
					/>
				</View>

				<View style={[styles.buttons, br.up('sm') && styles.buttonsRow]}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						onPress={resetToDefault}
					/>
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
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	connectedPeer: {
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
	protocol: {
		marginTop: 11,
	},
	buttons: {
		marginTop: 'auto',
		gap: 16,
	},
	buttonsRow: {
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
});

export default memo(ElectrumConfig);
