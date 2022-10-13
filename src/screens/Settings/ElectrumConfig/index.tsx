import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { err, ok, Result } from '@synonymdev/result';
import Url from 'url-parse';

import {
	Text,
	View,
	TextInput,
	RadioButtonRN,
	ScrollView,
	Text01S,
	Caption13Up,
	ScanIcon,
} from '../../../styles/components';
import { addElectrumPeer } from '../../../store/actions/settings';
import {
	ICustomElectrumPeer,
	RadioButtonItem,
	TProtocol,
} from '../../../store/types/settings';
import { updateUser } from '../../../store/actions/user';
import Store from '../../../store/types';
import { connectToElectrum } from '../../../utils/wallet/electrum';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import { objectsMatch, shuffleArray } from '../../../utils/helpers';
import {
	defaultElectrumPorts,
	getDefaultPort,
	getPeers,
	IFormattedPeerData,
} from '../../../utils/electrum';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import { getConnectedPeer, IPeerData } from '../../../utils/wallet/electrum';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
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
	const [randomPeers, setRandomPeers] = useState<IFormattedPeerData[]>([]);

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
		const randomPeersResponse = await getPeers({ selectedNetwork });
		if (randomPeersResponse.isOk()) {
			setRandomPeers(randomPeersResponse.value);
		}
	};

	const saveConnectedPeer = (): void => {
		try {
			if (host !== connectedPeer?.host) {
				setHost(connectedPeer?.host);
			}
			if (port !== connectedPeer?.port.toString()) {
				setPort(connectedPeer?.port.toString());
			}
			if (protocol !== connectedPeer?.protocol) {
				setProtocol(connectedPeer?.protocol);
			}
			connectAndAddPeer({
				host: connectedPeer.host,
				port: String(connectedPeer.port),
				protocol: connectedPeer.protocol,
			});
		} catch (e) {
			console.log(e);
		}
	};

	const initialIndex = useMemo((): number => {
		let index = -1;
		try {
			radioButtons.map((button, i) => {
				if (protocol === button.value) {
					index = i + 1;
				}
			});
			return index || -1;
		} catch (e) {
			return index;
		}
	}, [protocol]);

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
				const getPeersResult = await getPeers({ selectedNetwork });
				if (getPeersResult.isOk()) {
					setRandomPeers(getPeersResult.value);
				}
			} else {
				updateUser({ isConnectedToElectrum: false });
				showErrorNotification({
					title: 'Unable to connect to Electrum Server',
					message: connectResponse.error.message,
				});
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

	const getRandomPeer = async (): Promise<void> => {
		if (randomPeers?.length > 0) {
			const shuffledArr = shuffleArray(randomPeers);
			for (let i = 0; i < shuffledArr.length; i++) {
				if (
					host !== shuffledArr[i]?.host.toLowerCase() &&
					connectedPeer.host !== shuffledArr[i]?.host.toLowerCase()
				) {
					const peer = shuffledArr[i];
					setHost(peer.host.toLowerCase());
					setPort(peer[protocol].toString().replace(/\D/g, ''));
					break;
				}
			}
		}
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
					{!!connectedPeer?.host && (
						<>
							<Text01S color="gray1">Currently connected to</Text01S>
							<View style={styles.row}>
								<View style={styles.connectedPeer}>
									<Text color="green">
										{connectedPeer.host}:{connectedPeer.port}
									</Text>
								</View>
								{!peersMatch(connectedPeer) && (
									<View style={styles.savePeer}>
										<Button
											text="Save This Peer"
											color="surface"
											onPress={saveConnectedPeer}
										/>
									</View>
								)}
							</View>
						</>
					)}

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
					<RadioButtonRN
						data={radioButtons}
						selectedBtn={(e): void => {
							let value = '';
							try {
								value = e.value;
							} catch {}
							setProtocol(value);
							//Toggle the port if the protocol changes and the default ports are still set.
							if (!port || defaultElectrumPorts.includes(port.toString())) {
								setPort(getDefaultPort(selectedNetwork, value));
							}
						}}
						initial={initialIndex}
					/>

					<View style={styles.buttons}>
						<Button
							text="Reset To Default"
							variant="secondary"
							size="large"
							onPress={getRandomPeer}
						/>
						{!peersMatch({ host, port, protocol }) && (
							<>
								<View style={styles.divider} />
								<Button
									text="Connect To Host"
									size="large"
									loading={loading}
									onPress={(): void => {
										connectAndAddPeer({ host, port, protocol });
									}}
								/>
							</>
						)}
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
		marginBottom: 8,
	},
	connectedPeer: {
		flex: 1.5,
	},
	savePeer: {
		alignItems: 'center',
		flex: 1,
	},
	textInput: {
		minHeight: 50,
		marginVertical: 5,
	},
	buttons: {
		marginTop: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	divider: {
		width: 16,
	},
});

export default memo(ElectrumConfig);
