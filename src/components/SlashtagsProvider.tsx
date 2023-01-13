import React, { ReactElement, useContext, useEffect, useState } from 'react';
import SDK from '@synonymdev/slashtags-sdk';
import { createContext } from 'react';
import { useSelector } from 'react-redux';
import RAWSFactory from 'random-access-web-storage';
import b4a from 'b4a';

import { storage as mmkv } from '../store/mmkv-storage';
import { IContactRecord } from '../store/types/slashtags';
import { getSlashtagsPrimaryKey } from '../utils/wallet';
import {
	decodeJSON,
	getSelectedSlashtag,
	onSDKError,
} from '../utils/slashtags';
import { updateSeederMaybe } from '../store/actions/slashtags';
import { SLASHTAGS_SEEDER_TOPIC, DISABLE_SLASHTAGS } from '@env';
import { seedHashSelector } from '../store/reselect/wallet';

export const RAWS = RAWSFactory({
	setItem: (key: string, value: string) => {
		mmkv.set(key, value);
	},
	getItem: (key: string) => {
		return mmkv.getString(key);
	},
	removeItem: (key: string) => {
		mmkv.delete(key);
	},
});

export interface ISlashtagsContext {
	sdk: SDK;
	contacts: { [url: string]: IContactRecord | undefined };
}

const SlashtagsContext = createContext<ISlashtagsContext>({
	sdk: {} as SDK,
	contacts: {},
});

const RECONNECT_DHT_RELAY_INTERVAL = 1000 * 2;

/**
 * All things Slashtags that needs to happen on start of Bitkit
 * or stay available and cached through the App.
 */
export const SlashtagsProvider = ({
	children,
}: {
	children: ReactElement;
}): JSX.Element => {
	const [primaryKey, setPrimaryKey] = useState<string>();
	const [opened, setOpened] = useState(false);
	const [contacts, setContacts] = useState<ISlashtagsContext['contacts']>({});
	const [sdk, setSDK] = useState<SDK>();

	// Load primaryKey from keychain
	const seedHash = useSelector(seedHashSelector);

	useEffect(() => {
		if (!seedHash) {
			return;
		}
		getSlashtagsPrimaryKey(seedHash).then(({ error, data }) => {
			if (error || (data && data.length === 0)) {
				onSDKError(
					new Error(
						'Could not load primaryKey from keyChain, data:"' + data + '"',
					),
				);
				return;
			}
			setPrimaryKey(data);
		});
	}, [seedHash]);

	// SDK creating and reconnecting after relay disconnect!
	useEffect(() => {
		if (!primaryKey) {
			return;
		}

		let unmounted = false;

		const pk = primaryKey && b4a.from(primaryKey, 'hex');
		const relayAddress = 'wss://dht-relay.synonym.to';

		const relaySocket = new WebSocket(relayAddress);
		relaySocket.onopen = (): void => {
			relaySocket.onclose = reconnect;
		};

		!DISABLE_SLASHTAGS && createSDK(relaySocket);

		function createSDK(relay: WebSocket): void {
			const _sdk = new SDK({
				// @ts-ignore
				primaryKey: pk,
				// TODO(slashtags): replace it with non-blocking storage,
				// like random access react native after m1 support. or react-native-fs?
				storage: RAWS,
				// TODO(slashtags): add settings to customize this relay or use native
				relay,
			});

			if (unmounted) {
				return;
			}

			setSDK(_sdk);
			exportedSDK = _sdk;
		}

		async function reconnect(): Promise<void> {
			// act as once('close')
			relaySocket.onclose = noop;
			console.log('Reconnecting to dht relay');

			let connected: WebSocket | undefined;
			let tries = 0;

			while (!connected && !unmounted) {
				connected = await new Promise((resolve) => {
					setTimeout(() => {
						const _relay = new WebSocket(relayAddress);
						_relay.onclose = (): void => resolve(undefined);
						_relay.onerror = (): void => resolve(undefined);
						_relay.onopen = (): void => resolve(_relay);
					}, RECONNECT_DHT_RELAY_INTERVAL);
				});
				console.log('Attempted to reconnect to dht relay', { tries: tries++ });
			}

			if (connected) {
				console.log('Reconnected to dht relay');
				connected.onclose = reconnect;
				createSDK(connected);
			}
		}

		return function cleanup(): void {
			unmounted = true;
		};
	}, [primaryKey]);

	useEffect(() => {
		// Wait for primary key to be loaded from keyChain
		if (!sdk) {
			return;
		}

		let unmounted = false;

		// Setup local Slashtags
		(async (): Promise<void> => {
			await sdk.ready().catch(onSDKError);
			!unmounted && setOpened(true);

			// If corestore is closed for some reason, should not try to load drives
			if (!sdk || sdk.closed) {
				return;
			}

			// Hardcode a single topic to connect to the seeder
			// seeder this way won't need to announce O(n) topics.
			const topic = b4a.from(SLASHTAGS_SEEDER_TOPIC, 'hex');
			sdk.join(topic, { server: false, client: true });

			// Increase swarm sockets max event listeners
			sdk.swarm.on('connection', (socket: any) => socket.setMaxListeners(1000));

			const slashtag = getSelectedSlashtag(sdk);

			// Send cores to seeder
			updateSeederMaybe(slashtag).catch(onError);

			// Update contacts

			// Load contacts from contacts drive on first loading of the app
			const contactsDrive = slashtag.drivestore.get('contacts');
			contactsDrive
				.ready()
				.then(() => {
					updateContacts();
					contactsDrive.core.on('append', updateContacts);
				})
				.catch(onError);

			function updateContacts(): void {
				const rs = contactsDrive.readdir('/');
				const promises: { [url: string]: Promise<IContactRecord> } = {};

				rs.on('data', (id: string) => {
					const url = 'slash:' + id;

					promises[id] = contactsDrive
						.get('/' + id)
						.then(decodeJSON)
						.then((record: IContactRecord) => ({ ...record, url }))
						.catch(onErrorRead);
				});
				rs.on('end', async () => {
					const resolved = await Promise.all(Object.values(promises));

					!unmounted &&
						setContacts(
							Object.fromEntries(
								resolved.map((contact) => [contact.url, contact]),
							),
						);
				});
			}
		})();

		return function cleanup() {
			unmounted = true;
			// sdk automatically gracefully close anyway!
		};
	}, [sdk]);

	return (
		// Do not render children (depending on the sdk) until the primary key is loaded and the sdk opened
		<SlashtagsContext.Provider value={{ sdk: sdk as SDK, contacts }}>
			{(opened || DISABLE_SLASHTAGS) && children}
		</SlashtagsContext.Provider>
	);
};

export const useSlashtagsSDK = (): SDK => useContext(SlashtagsContext).sdk;

export const useSlashtags = (): ISlashtagsContext => {
	return useContext(SlashtagsContext);
};

let exportedSDK: SDK | undefined;
export { exportedSDK as sdk };

function onError(error: Error): void {
	console.debug(
		'Error in SlashtagsProvider while opening drive',
		error.message,
	);
}

function onErrorRead(error: Error): void {
	console.debug(
		'Error in SlashtagsProvider while reading drive',
		error.message,
	);
}

function noop(): void {}
