import SlashtagsProfile from '@synonymdev/slashtags-profile';
import { format, parse } from '@synonymdev/slashtags-url';
import { useContext, useEffect, useMemo, useState } from 'react';

import {
	SlashtagsContext,
	TSlashtagsStateContext,
} from '../components/SlashtagsProvider';
import { __E2E__ } from '../constants/env';
import {
	contactSelector,
	profileCacheSelector,
} from '../store/reselect/slashtags';
import { cacheProfile } from '../store/slices/slashtags';
import { BasicProfile } from '../store/types/slashtags';
import { useAppDispatch, useAppSelector } from './redux';

export const useSlashtags = (): TSlashtagsStateContext => {
	return useContext(SlashtagsContext);
};

export const useProfile = (
	origUrl: string,
	opts?: { resolve?: boolean },
): {
	resolving: boolean;
	profile: BasicProfile;
	url: string;
} => {
	const dispatch = useAppDispatch();
	const { webRelayClient, webRelayUrl } = useSlashtags();
	const [resolving, setResolving] = useState(true);
	const [url, profileUrl] = useMemo(() => {
		const parsed = parse(origUrl);
		const url1 = format(parsed.key, {
			query: { relay: parsed.query?.relay ?? webRelayUrl },
		});
		const url2 = format(parsed.key, {
			path: '/profile.json',
			query: { relay: parsed.query?.relay ?? webRelayUrl },
		});
		return [url1, url2];
	}, [origUrl, webRelayUrl]);
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
			.get(profileUrl)
			.then((pr) => {
				if (unmounted) {
					return;
				}

				setResolving(false);

				if (pr) {
					dispatch(cacheProfile({ url: profileUrl, profile: pr }));
				}

				if (!unmounted) {
					setResolving(false);
				}
			})
			.catch((err: Error) => {
				console.log('Profile resolve error', err);
			});

		// do not use subscriptions in e2e tests
		if (__E2E__) {
			return;
		}

		const unsubscribe = reader.subscribe(profileUrl, (pr: BasicProfile) => {
			if (unmounted) {
				return;
			}

			dispatch(cacheProfile({ url: profileUrl, profile: pr }));
		});

		let unmounted = false;

		return (): void => {
			unsubscribe();
			unmounted = true;
		};
	}, [webRelayClient, profileUrl, shouldResolve, dispatch]);

	return {
		resolving,
		profile: withContactRecord,
		url,
	};
};
