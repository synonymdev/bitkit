import { useContext, useEffect, useMemo, useState } from 'react';
import SlashtagsProfile from '@synonymdev/slashtags-profile';

import { BasicProfile } from '../store/types/slashtags';
import {
	contactSelector,
	profileCacheSelector,
} from '../store/reselect/slashtags';
import { useAppSelector } from './redux';
import { cacheProfile2 } from '../store/actions/slashtags';
import {
	ISlashtagsContext2,
	SlashtagsContext2,
	webRelayClient,
} from '../components/SlashtagsProvider2';

export const useSelectedSlashtag2 = (): {
	url: string;
} => {
	const { url } = useSlashtags2();
	return { url };
};

export const useSlashtags2 = (): ISlashtagsContext2 => {
	return useContext(SlashtagsContext2);
};

export const useProfile2 = (
	url: string,
	opts?: { resolve?: boolean },
): { resolving: boolean; profile: BasicProfile } => {
	const [resolving, setResolving] = useState(true);
	const contact = useAppSelector((state) => {
		return contactSelector(state, url);
	});
	const profile = useAppSelector((state) => {
		return profileCacheSelector(state, url);
	});

	const withContactRecord = useMemo(() => {
		return contact?.name ? { ...profile, name: contact.name } : profile;
	}, [profile, contact]);

	const shouldResolve = opts?.resolve ?? true;

	useEffect(() => {
		// Skip resolving profile from peers to avoid blocking UI
		if (!shouldResolve) {
			return;
		}

		const reader = new SlashtagsProfile(webRelayClient);
		reader
			.get(url)
			.then((pr) => {
				// console.info('Profile resolved', url, pr);
				if (unmounted) {
					return;
				}

				setResolving(false);

				if (pr) {
					cacheProfile2(url, pr);
				}

				if (!unmounted) {
					setResolving(false);
				}
			})
			.catch((err: Error) => {
				console.log('Profile resolve error', err);
			});

		// const unsubscribe = reader.subscribe(url, (pr: BasicProfile) => {
		// 	console.info('Profile updated', pr);
		// 	if (unmounted) {
		// 		return;
		// 	}

		// cacheProfile2(url, pr);
		// })

		let unmounted = false;

		return (): void => {
			// unsubscribe();
			unmounted = true;
		};
	}, [url, shouldResolve]);

	return {
		resolving,
		profile: withContactRecord,
	};
};
