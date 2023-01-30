import * as electrum from 'rn-electrum-client/helpers';
import { err, ok, Result } from '@synonymdev/result';

import { TAvailableNetworks } from '../networks';
import { getSelectedNetwork } from '../wallet';
import { connectToElectrum } from '../wallet/electrum';
import { TProtocol } from '../../store/types/settings';

const hardcodedPeers = require('rn-electrum-client/helpers/peers.json');

export const defaultElectrumPorts = ['51002', '50002', '51001', '50001'];

/**
 * Returns the default port for the given network and protocol.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [protocol]
 */
export const getDefaultPort = (
	selectedNetwork: TAvailableNetworks,
	protocol: TProtocol,
): string => {
	if (protocol === 'ssl') {
		return selectedNetwork === 'bitcoinTestnet' ? '51002' : '50002';
	} else {
		return selectedNetwork === 'bitcoinTestnet' ? '51001' : '50001';
	}
};

/**
 * Returns the protocol for the given network and default port.
 * @param {string} [port]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getProtocolForPort = (
	port: string,
	selectedNetwork?: TAvailableNetworks,
): TProtocol | undefined => {
	if (port === '443') {
		return 'ssl';
	}

	if (selectedNetwork === 'bitcoinTestnet') {
		return port === '51002' ? 'ssl' : 'tcp';
	}

	return port === '50002' ? 'ssl' : 'tcp';
};

export interface IFormattedPeerData {
	ip?: string;
	host: string;
	version?: string;
	ssl: string | number;
	tcp: string | number;
}

/**
 * Formats the peer data response from an Electrum server.
 * @param {[string, string, [string, string, string]]} data
 * @return Result<IFormattedPeerData>
 */
export const formatPeerData = (
	data: [string, string, [string, string, string]],
): Result<IFormattedPeerData> => {
	try {
		if (!data) {
			return err('No data provided.');
		}
		if (data?.length !== 3) {
			return err('Invalid peer data');
		}
		if (data[2]?.length < 2) {
			return err('Invalid peer data');
		}
		const [ip, host, ports] = data;
		const [version, ssl, tcp] = ports;
		return ok({
			ip,
			host,
			version,
			ssl,
			tcp,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns an array of peers.
 * If unable to acquire peers from an Electrum server the method will default to the hardcoded peers in peers.json.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return Promise<Result<IFormattedPeerData[]>>
 */
export const getPeers = async ({
	selectedNetwork,
}: {
	selectedNetwork: TAvailableNetworks;
}): Promise<Result<IFormattedPeerData[]>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const response = await electrum.getPeers({ network: selectedNetwork });
		if (!response.error) {
			// Return an array of peers provided by the currently connected electrum server.
			let peers: IFormattedPeerData[] = [];
			await Promise.all(
				response.data.map(async (peer) => {
					const formattedPeer = await formatPeerData(peer);
					if (formattedPeer.isOk()) {
						peers.push(formattedPeer.value);
					}
				}),
			);
			if (peers?.length > 0) {
				return ok(peers);
			}
		}
		// No peers available grab hardcoded peers instead.
		return ok(hardcodedPeers[selectedNetwork]);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

const POLLING_INTERVAL = 1000 * 10;

type ElectrumConnectionPubSub = {
	publish: (isConnected: boolean) => void;
	subscribe: (
		callback: (isConnected: boolean) => void,
	) => ElectrumConnectionSubscription;
};

type ElectrumConnectionSubscription = {
	remove(): void;
};

/**
 * PubSub for Electrum server connection
 * If connection was lost this will try to reconnect in the specified interval
 */
export const electrumConnection = ((): ElectrumConnectionPubSub => {
	let subscribers: Set<(isConnected: boolean) => void> = new Set();
	let latestState: boolean | null = null;

	function publish(isConnected: boolean): void {
		// Skip if no subscribers
		if (subscribers.size === 0) {
			return;
		}

		// Skip the first check
		if (latestState === null) {
			latestState = isConnected;
			return;
		}

		// Skip if state hasn't changed
		if (isConnected === latestState) {
			return;
		}

		latestState = isConnected;
		subscribers.forEach((callback) => callback(isConnected));
	}

	function subscribe(
		callback: (isConnected: boolean) => void,
	): ElectrumConnectionSubscription {
		subscribers.add(callback);

		const timerId = setInterval(async () => {
			// Check the connection
			const { error } = await electrum.pingServer();
			electrumConnection.publish(!error);

			// Try to reconnect
			if (error) {
				connectToElectrum({});
			}
		}, POLLING_INTERVAL);

		return {
			remove: (): void => {
				clearInterval(timerId);
				subscribers.delete(callback);
			},
		};
	}

	return {
		publish,
		subscribe,
	};
})();
