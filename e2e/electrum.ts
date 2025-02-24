import net from 'net';
import tls from 'tls';
import BitcoinJsonRpc from 'bitcoin-json-rpc';
import * as electrum from 'rn-electrum-client/helpers';
import { EProtocol } from 'beignet';
import { bitcoinURL, electrumHost, electrumPort, sleep } from './helpers';

const peer = {
	host: electrumHost,
	protocol: EProtocol.tcp,
	tcp: electrumPort,
	ssl: 60002,
};

const TIMEOUT = 30 * 1000; // 30 seconds

// Connect to the Bitcoin Core node and Electrum server to wait for Electrum to sync
const initElectrum = async (): Promise<{
	waitForSync: () => Promise<void>;
	stop: () => Promise<void>;
}> => {
	let electrumHeight = 0;

	try {
		const nodeRpc = new BitcoinJsonRpc(bitcoinURL);
		await electrum.start({
			network: 'bitcoinRegtest',
			customPeers: [peer],
			net,
			tls,
		});

		const { data: header } = await electrum.subscribeHeader({
			network: 'bitcoinRegtest',
			onReceive: (data) => {
				electrumHeight = data[0].height;
			},
		});

		electrumHeight = header.height;

		// Wait for Electrum to sync with the Bitcoin node
		const waitForSync = async (): Promise<void> => {
			const startTime = Date.now();

			while (true) {
				const nodeHeight = await nodeRpc.getBlockCount();

				if (nodeHeight === electrumHeight) {
					break;
				}

				if (Date.now() - startTime > TIMEOUT) {
					throw new Error('Electrum sync timeout');
				}

				await sleep(1000);
			}
		};

		return {
			waitForSync,
			stop: electrum.stop,
		};
	} catch (error) {
		await electrum.stop();
		throw error;
	}
};

export default initElectrum;
