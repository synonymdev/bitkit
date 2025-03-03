import KeyChain from '@synonymdev/slashtags-keychain';
import SlashtagsProfile from '@synonymdev/slashtags-profile';
import { format, parse } from '@synonymdev/slashtags-url';
import type { Client as IWebRelayClient } from '@synonymdev/web-relay';
import { Client, Store } from '@synonymdev/web-relay/lib/client';
import React, { ReactElement, useEffect, useState } from 'react';
import { createContext } from 'react';

import { useAppSelector } from '../hooks/redux';
import { WebRelayCache } from '../storage';
import { webRelaySelector } from '../store/reselect/settings';
import { seedHashSelector } from '../store/reselect/wallet';
import i18n from '../utils/i18n';
import { showToast } from '../utils/notifications';
import { getSlashtagsPrimaryKey } from '../utils/wallet';

const store: Store = new WebRelayCache('slashtags.db');

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
			if (primaryKeyRes.isErr() || primaryKeyRes.value.length === 0) {
				showToast({
					type: 'warning',
					title: i18n.t('other:error_keychain'),
					description: i18n.t('other:error_keychain_msg'),
				});
				return;
			}
			const primaryKeyBuffer = Buffer.from(primaryKeyRes.value, 'hex');
			const primaryKey = new Uint8Array(primaryKeyBuffer);
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
