import { TAvailableNetworks } from '../networks';
import { EProtocol } from 'beignet';

export const defaultElectrumPorts = ['51002', '50002', '51001', '50001'];

/**
 * Returns the default port for the given network and protocol.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [protocol]
 */
export const getDefaultPort = (
	selectedNetwork: TAvailableNetworks,
	protocol: EProtocol,
): number => {
	if (protocol === EProtocol.ssl) {
		return selectedNetwork === 'bitcoinTestnet' ? 51002 : 50002;
	} else {
		return selectedNetwork === 'bitcoinTestnet' ? 51001 : 50001;
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
): EProtocol => {
	if (port === '443') {
		return EProtocol.ssl;
	}

	if (selectedNetwork === 'bitcoinTestnet') {
		return port === '51002' ? EProtocol.ssl : EProtocol.tcp;
	}

	return port === '50002' ? EProtocol.ssl : EProtocol.tcp;
};
