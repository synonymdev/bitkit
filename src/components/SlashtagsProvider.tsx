import React, { ReactElement, useEffect, useState } from 'react';
import { createContext } from 'react';
import b4a from 'b4a';
import KeyChain from '@synonymdev/slashtags-keychain';
import type { Client as IWebRelayClient } from '@synonymdev/web-relay';
import Client from '@synonymdev/web-relay/lib/client';
import SlashtagsProfile from '@synonymdev/slashtags-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parse } from '@synonymdev/slashtags-url';

import { getSlashtagsPrimaryKey } from '../utils/wallet';
import { seedHashSelector } from '../store/reselect/wallet';
import { showToast } from '../utils/notifications';
import { useAppSelector } from '../hooks/redux';
import { webRelaySelector } from '../store/reselect/settings';
import i18n from '../utils/i18n';

class Store {
	location: string;

	constructor(location: string) {
		this.location = 'WEB-RELAY-CLIENT!' + location + '!';
	}

	async *iterator(
		opts: Parameters<Client.Store['iterator']>[0],
	): AsyncIterable<[string, Uint8Array | undefined]> {
		const allKeys = await AsyncStorage.getAllKeys();
		for (let key of allKeys) {
			if (!key.startsWith(this.location)) {
				continue;
			}

			const suffix = key.replace(this.location, '');

			// @ts-ignore
			if (opts.gt && suffix <= opts.gt) {
				continue;
			}
			// @ts-ignore
			if (opts.gte && suffix < opts.gte) {
				continue;
			}
			// @ts-ignore
			if (opts.lt && suffix >= opts.lt) {
				continue;
			}
			// @ts-ignore
			if (opts.lte && suffix > opts.lte) {
				continue;
			}

			const value = await AsyncStorage.getItem(key);
			const buffer = value ? b4a.from(value, 'hex') : undefined;

			yield [key, buffer];
		}
	}

	_storeKey(key: string): string {
		return this.location + key;
	}

	async put(key: string, buffer: Uint8Array): Promise<void> {
		const value = b4a.toString(buffer, 'hex');
		return AsyncStorage.setItem(this._storeKey(key), value);
	}

	async del(key: string): Promise<void> {
		return AsyncStorage.removeItem(this._storeKey(key));
	}

	async get(key: string): Promise<Uint8Array | undefined> {
		const value = await AsyncStorage.getItem(this._storeKey(key));
		const buffer = value ? b4a.from(value, 'hex') : undefined;
		return buffer;
	}

	batch(): Store {
		return this;
	}

	write(): Store {
		return this;
	}

	async close(): Promise<void> {}
}

const store = new Store('slashtags.db') as unknown as Client.Store;

export let webRelayClient: IWebRelayClient;
let profile: SlashtagsProfile;

export interface TSlashtagsStateContext {
	webRelayClient: Client;
	webRelayUrl: string;
	url: string;
	profile: SlashtagsProfile;
}

export const SlashtagsContext = createContext<TSlashtagsStateContext>({
	webRelayClient: {} as Client,
	webRelayUrl: '',
	url: '',
	profile: {} as SlashtagsProfile,
});

export const SlashtagsProvider = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const [client, setClient] = useState<IWebRelayClient>();
	const [url, setUrl] = useState<string>('');
	const seedHash = useAppSelector(seedHashSelector);
	const webRelayUrl = useAppSelector(webRelaySelector);

	useEffect(() => {
		if (!seedHash) {
			return;
		}

		(async (): Promise<void> => {
			const primaryKeyRes = await getSlashtagsPrimaryKey(seedHash);
			if (
				primaryKeyRes.error ||
				(primaryKeyRes.data && primaryKeyRes.data.length === 0)
			) {
				showToast({
					type: 'warning',
					title: i18n.t('other:error_keychain'),
					description: i18n.t('other:error_keychain_msg'),
				});
				return;
			}
			const primaryKey = b4a.from(primaryKeyRes.data, 'hex');
			const keyPair = KeyChain.createKeyPair(primaryKey);

			webRelayClient = new Client({
				relay: webRelayUrl,
				keyPair,
				store,
			});
			setClient(webRelayClient);

			profile = new SlashtagsProfile(webRelayClient);
			const profileUrl = await profile.createURL();
			const parsed = parse(profileUrl);
			const long = format(parsed.key, {
				query: { relay: webRelayUrl },
			});
			setUrl(long);
		})();
	}, [seedHash, webRelayUrl]);

	return (
		// Do not render children until we have a url
		<SlashtagsContext.Provider
			value={{
				webRelayClient: client,
				webRelayUrl,
				url,
				profile,
			}}>
			{url && children}
		</SlashtagsContext.Provider>
	);
};
