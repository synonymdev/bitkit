import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { SDK, SlashURL } from '@synonymdev/slashtags-sdk';

import { useSlashtags, useSlashtagsSDK } from '../components/SlashtagsProvider';
import { BasicProfile, IRemote } from '../store/types/slashtags';
import { decodeJSON, getSelectedSlashtag } from '../utils/slashtags';
import Store from '../store/types';
import { cacheProfile } from '../store/actions/slashtags';

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
 * Watches the public profile of a local or remote slashtag by its url.
 * Overrides name property if it is saved as a contact record!
 *
 * @param {boolean} [opts.resolve = false]
 * Resolve profile updates from remote peers (or seeder).
 * Defaults to false.
 * To force resolving profiles set `opts.resolve = true`.
 */
export const useProfile = (
	url: string,
	opts?: {
		resolve?: boolean;
	},
): { resolving: boolean; profile: BasicProfile } => {
	const sdk = useSlashtagsSDK();
	const contactRecord = useSlashtags().contacts[url];
	const [resolving, setResolving] = useState(true);
	const profile = useSelector((state: Store) => {
		return state.slashtags.profiles?.[url]?.profile || {};
	});

	const withContactRecord = useMemo(() => {
		return contactRecord?.name
			? { ...profile, name: contactRecord.name }
			: profile;
	}, [profile, contactRecord]);

	const shouldResolve = Boolean(opts?.resolve);

	useEffect(() => {
		// Skip resolving profile from peers to avoid blocking UI
		if (!shouldResolve) {
			return;
		}

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
				resolve().finally(() => {
					!unmounted && setResolving(false);
				});
				// Watch update
				drive.core.on('append', resolve);
			})
			.catch(onError);

		async function resolve(): Promise<void> {
			const version = await drive.files
				.get('/profile.json')
				.then((node: any) => node?.seq);

			const _profile = await drive
				.get('/profile.json')
				.then(decodeJSON)
				.catch(noop);

			cacheProfile(url, drive.files.feed.fork, version, _profile);
		}

		return function cleanup(): void {
			unmounted = true;
			drive.core.removeAllListeners();
			drive.close();
		};
	}, [url, sdk, shouldResolve]);

	return {
		resolving,
		profile: withContactRecord,
	};
};

function onError(error: Error): void {
	console.debug('Error opening drive in useProfile', error.message);
}

function noop(): void {}
