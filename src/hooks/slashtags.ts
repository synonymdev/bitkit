import { useEffect, useMemo, useState } from 'react';
import { SDK, SlashURL } from '@synonymdev/slashtags-sdk';
import c from 'compact-encoding';

import { useSlashtags, useSlashtagsSDK } from '../components/SlashtagsProvider';
import { BasicProfile, IRemote } from '../store/types/slashtags';
import { closeDriveSession, getSelectedSlashtag } from '../utils/slashtags';

export type Slashtag = ReturnType<SDK['slashtag']>;

/**
 * Returns the currently selected Slashtag
 */
export const useSelectedSlashtag = (): {
	url: string;
	slashtag: Slashtag;
} & IRemote => {
	const sdk = useSlashtagsSDK();
	const slashtag = getSelectedSlashtag(sdk);

	return { url: slashtag?.url, slashtag };
};

/**
 * Watchs the public profile of a local or remote slashtag by its url.
 * Overrides name property if it is saved as a contact record!
 */
export const useProfile = (
	url: string,
): { resolving: boolean; profile: BasicProfile } => {
	// TODO (slashtags) remove this caching if it is too costly
	const cached = useSlashtags().profiles[url];
	const [profile, setProfile] = useState<BasicProfile>(cached || {});
	const [resolving, setResolving] = useState(true);

	const contactRecord = useSlashtags().contacts[url];
	const withContactRecord = useMemo(() => {
		return contactRecord?.name
			? { ...profile, name: contactRecord.name }
			: profile;
	}, [profile, contactRecord]);

	const sdk = useSlashtagsSDK();

	useEffect(() => {
		let unmounted = false;
		if (sdk.closed) {
			console.debug('useProfile: SKIP sdk is closed');
			return;
		}

		const drive = sdk.drive(SlashURL.parse(url).key);

		drive
			.ready()
			.then(() => {
				// Resolve immediatly
				resolve();
				// Watch update
				drive.core.on('append', resolve);
			})
			.catch(onError);

		async function resolve(): Promise<void> {
			const _profile = await drive
				.get('/profile.json')
				.then((buf: Uint8Array) => buf && c.decode(c.json, buf))
				.catch(noop);

			set(_profile);
		}

		function set(_profile: BasicProfile): void {
			!unmounted && setResolving(false);
			!unmounted && setProfile(_profile);
		}

		return function cleanup(): void {
			unmounted = true;
			drive.core.removeAllListeners();
			closeDriveSession(drive);

			// It so happens that hypercore creates a new session for every hypercore replicated
			// on a stream (connection), and it wants to close that session once the stream is closed
			// memory leak warning is expected.
			// Uncomment following code to watch number of close listeners on replication streams
			// console.debug("close listeners",[...sdk.swarm._allConnections._byPublicKey.values()].map((s) => s.listenerCount('close')));
		};
	}, [url, sdk]);

	return {
		resolving,
		profile: withContactRecord,
	};
};

function onError(error: Error): void {
	console.debug('Error opening drive in useProfile', error.message);
}

function noop(): void {}
