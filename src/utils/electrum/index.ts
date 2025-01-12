import { EProtocol } from 'beignet';
import { EAvailableNetwork } from '../networks';

export const defaultElectrumPorts = ['51002', '50002', '51001', '50001'];

/**
 * Returns the default port for the given network and protocol.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} [protocol]
 */
export const getDefaultPort = (
	selectedNetwork: EAvailableNetwork,
	protocol: EProtocol,
): number => {
	if (protocol === EProtocol.ssl) {
		return selectedNetwork === 'bitcoinTestnet' ? 51002 : 50002;
	}
	return selectedNetwork === 'bitcoinTestnet' ? 51001 : 50001;
};

/**
 * Returns the protocol for the given network and default port.
 * @param {string} [port]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getProtocolForPort = (
	port: string,
	selectedNetwork?: EAvailableNetwork,
): EProtocol => {
	if (port === '443') {
		return EProtocol.ssl;
	}

	if (selectedNetwork === 'bitcoinTestnet') {
		return port === '51002' ? EProtocol.ssl : EProtocol.tcp;
	}

	return port === '50002' ? EProtocol.ssl : EProtocol.tcp;
};
