import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { err, ok, Result } from '@synonymdev/result';
import Url from 'url-parse';

import {
	Text,
	View,
	TextInput,
	ScrollView,
	Text01S,
	Caption13Up,
	ScanIcon,
} from '../../../styles/components';
import { addElectrumPeer } from '../../../store/actions/settings';
import { ICustomElectrumPeer, TProtocol } from '../../../store/types/settings';
import { updateUser } from '../../../store/actions/user';
import Store from '../../../store/types';
import { origCustomElectrumPeers } from '../../../store/shapes/settings';
import { connectToElectrum } from '../../../utils/wallet/electrum';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import { objectsMatch } from '../../../utils/helpers';
import { defaultElectrumPorts, getDefaultPort } from '../../../utils/electrum';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import { getConnectedPeer, IPeerData } from '../../../utils/wallet/electrum';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import {
	RadioButtonGroup,
	RadioButtonItem,
} from '../../../components/RadioButton';
import type { SettingsScreenProps } from '../../../navigation/types';

const radioButtons: RadioButtonItem[] = [
	{ label: 'TCP', value: 'tcp' },
	{ label: 'TLS', value: 'ssl' },
];

const validateInput = ({
	host = '',
	port = '',
}: {
	host: string;
	port: string | number;
}): Result<string> => {
	//Ensure the user passed in a host & port to test.
	let data;
	if (host === '' && port === '') {
		data = 'Please specify a host and port to connect to.';
	} else if (host === '') {
		data = 'Please specify a host to connect to.';
	} else if (port === '') {
		data = 'Please specify a port to connect to.';
	} else if (isNaN(Number(port))) {
		data = 'Invalid port.';
	}
	if (data) {
		return err(data);
	}
	return ok('');
};

const ElectrumConfig = ({
	navigation,
}: SettingsScreenProps<'ElectrumConfig'>): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const customElectrumPeers = useSelector(
		(state: Store) => state.settings.customElectrumPeers[selectedNetwork],
	);
	const savedPeer = customElectrumPeers[0];
	const [host, setHost] = useState(savedPeer?.host || '');
	const [protocol, setProtocol] = useState<TProtocol>(
		savedPeer?.protocol ? savedPeer.protocol : 'ssl',
	);
	const [port, setPort] = useState(
		savedPeer?.protocol
			? savedPeer[savedPeer.protocol]
			: getDefaultPort(selectedNetwork, protocol),
	);

	const [connectedPeer, setConnectedPeer] = useState<IPeerData>({
		host: '',
		port: '',
		protocol: '',
	});
	const [loading, setLoading] = useState(false);

	const getAndUpdateConnectedPeer = async (): Promise<void> => {
		const peerInfo = await getConnectedPeer(selectedNetwork);
		if (peerInfo.isOk()) {
			setConnectedPeer({
				...peerInfo.value,
				port: peerInfo.value.port.toString(),
			});
		}
	};

	const connectAndAddPeer = async (peerData: {
		host: string;
		port: number | string;
		protocol: TProtocol;
	}): Promise<void> => {
		try {
			if (loading) {
				return;
			}
			if (!peerData) {
				peerData = { host, port, protocol };
			}
			if (typeof port === 'number') {
				peerData.port.toString();
			}

			setLoading(true);
			const validityCheck = validateInput(peerData);
			if (validityCheck.isErr()) {
				showErrorNotification({
					title: 'Electrum Peer Error',
					message: validityCheck.error.message,
				});
				return;
			}
			const customPeer: ICustomElectrumPeer = {
				host: '',
				protocol: '',
				ssl: Number(getDefaultPort(selectedNetwork, 'ssl')),
				tcp: Number(getDefaultPort(selectedNetwork, 'tcp')),
			};
			const connectData = {
				...customPeer,
				host: peerData.host.trim(),
				protocol: peerData.protocol.trim(),
				[protocol]: peerData.port.toString().trim(),
			};
			const connectResponse = await connectToElectrum({
				selectedNetwork,
				customPeers: [connectData],
			});
			setLoading(false);
			if (connectResponse.isOk()) {
				addElectrumPeer({ selectedNetwork, peer: connectData });
				updateUser({ isConnectedToElectrum: true });
				showSuccessNotification({
					title: 'Electrum Server Updated',
					message: `Successfully connected to ${host}:${port}`,
				});
				getAndUpdateConnectedPeer();
			} else {
				updateUser({ isConnectedToElectrum: false });
				// showErrorNotification({
				// 	title: 'Unable to connect to Electrum Server',
				// 	message: connectResponse.error.message,
				// });
			}
		} catch (e) {
			console.log(e);
			setLoading(false);
		}
	};

	/**
	 * Compare against the currently saved peer.
	 * @param _peer
	 */
	const peersMatch = (_peer: IPeerData): boolean => {
		try {
			if (!savedPeer.protocol) {
				return false;
			}
			return objectsMatch(_peer, {
				host: savedPeer.host.toLowerCase(),
				port: savedPeer[savedPeer.protocol],
				protocol: savedPeer.protocol,
			});
		} catch (e) {
			return false;
		}
	};

	const resetToDefault = (): void => {
		const peer = origCustomElectrumPeers[selectedNetwork][0];
		setHost(peer.host);
		setPort(peer[peer.protocol].toString());
		setProtocol(peer.protocol);
	};

	useEffect(() => {
		getAndUpdateConnectedPeer();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner', { onScan });
	};

	const onScan = (data: string): void => {
		const url = new Url(data);
		if (!url.hostname || !url.port) {
			showErrorNotification({
				title: 'No Data Detected',
				message: 'Sorry, Bitkit is not able to read this QR code.',
			});
			return;
		}
		setHost(url.hostname);
		setPort(url.port);
	};

	const isButtonDisabled = peersMatch({ host, port, protocol });

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Electrum Server"
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.content}>
				<ScrollView bounces={false}>
					<Text01S color="gray1">Currently connected to</Text01S>
					<View style={styles.row}>
						<View style={styles.connectedPeer}>
							{connectedPeer.host ? (
								<Text color="green">
									{connectedPeer.host}:{connectedPeer.port}
								</Text>
							) : (
								<Text color="red">disconnected</Text>
							)}
						</View>
					</View>

					<Caption13Up color="gray1" style={styles.label}>
						HOST
					</Caption13Up>
					<TextInput
						style={styles.textInput}
						textAlignVertical={'center'}
						underlineColorAndroid="transparent"
						autoCapitalize="none"
						autoCompleteType="off"
						keyboardType="default"
						autoCorrect={false}
						onChangeText={setHost}
						value={host}
						returnKeyType="done"
					/>

					<Caption13Up color="gray1" style={styles.label}>
						PORT
					</Caption13Up>
					<TextInput
						style={styles.textInput}
						textAlignVertical={'center'}
						underlineColorAndroid="transparent"
						autoCapitalize="none"
						autoCompleteType="off"
						keyboardType="number-pad"
						autoCorrect={false}
						onChangeText={setPort}
						value={port.toString()}
					/>

					<Caption13Up color="gray1" style={styles.label}>
						PROTOCOL
					</Caption13Up>
					<RadioButtonGroup
						data={radioButtons}
						value={protocol}
						onPress={(value): void => {
							setProtocol(value);
							//Toggle the port if the protocol changes and the default ports are still set.
							if (!port || defaultElectrumPorts.includes(port.toString())) {
								setPort(getDefaultPort(selectedNetwork, value));
							}
						}}
					/>

					<View style={styles.buttons}>
						<Button
							text="Reset To Default"
							variant="secondary"
							size="large"
							onPress={resetToDefault}
						/>
						<View style={styles.divider} />
						<Button
							text="Connect To Host"
							size="large"
							loading={loading}
							disabled={isButtonDisabled}
							onPress={(): void => {
								connectAndAddPeer({ host, port, protocol });
							}}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		flex: 1,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingTop: 5,
		paddingBottom: 8,
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
		minHeight: 50,
		marginVertical: 5,
	},
	buttons: {
		marginTop: 16,
		flexDirection: 'row',
	},
	divider: {
		width: 16,
	},
});

export default memo(ElectrumConfig);
