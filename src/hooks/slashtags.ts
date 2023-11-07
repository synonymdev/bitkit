import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SDK, { SlashURL } from '@synonymdev/slashtags-sdk';

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

	return { url: slashtag.url, slashtag };
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
	opts?: { resolve?: boolean },
): { resolving: boolean; profile: BasicProfile } => {
	const sdk = useSlashtagsSDK();
	const contactRecord = useSlashtags().contacts[url];
	const [resolving, setResolving] = useState(true);
	const profile = useSelector((state: Store) => {
		return state.slashtags.profiles?.[url]?.profile;
	});

	const withContactRecord = useMemo(() => {
		return contactRecord?.name
			? { ...profile, name: contactRecord.name }
			: profile;
	}, [profile, contactRecord]);

	// If We are restoring wallet, try to resolve anyways
	const shouldResolve = opts?.resolve || !profile;

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

		const getData = async (): Promise<void> => {
			const read = async (): Promise<void> => {
				const node = await drive.files.get('/profile.json');
				const version = node?.seq;

				const buffer = await drive.get('/profile.json');
				const _profile = decodeJSON(buffer) as BasicProfile;

				cacheProfile(url, drive.files.feed.fork, version, _profile);

				if (!unmounted) {
					setResolving(false);
				}
			};

			try {
				await drive.ready();
				// Resolve immediately
				read();
				// Watch update
				drive.core.on('append', read);
			} catch (error) {
				console.debug('Error opening drive in useProfile', error.message);
			}
		};

		getData();

		return (): void => {
			unmounted = true;
			drive.core.removeAllListeners();
			drive.close();
		};
	}, [url, sdk, shouldResolve]);

	return {
		resolving,
		profile: withContactRecord || {},
	};
};
