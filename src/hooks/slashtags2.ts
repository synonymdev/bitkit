import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import SlashtagsProfile from '@synonymdev/slashtags-profile';
import { format, parse } from '@synonymdev/slashtags-url';

import { BasicProfile } from '../store/types/slashtags';
import {
	contactSelector,
	contactsSelector,
	profileCacheSelector,
} from '../store/reselect/slashtags';
import { addContacts, cacheProfile2 } from '../store/actions/slashtags';
import {
	ISlashtagsContext2,
	SlashtagsContext2,
} from '../components/SlashtagsProvider2';
import { useSlashtags } from '../components/SlashtagsProvider';
import { __E2E__ } from '../constants/env';
import { getNewProfileUrl, saveProfile2 } from '../utils/slashtags2';
import { useAppSelector } from './redux';
import { useProfile, useSelectedSlashtag } from './slashtags';

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
	origUrl: string,
	opts?: { resolve?: boolean },
): {
	resolving: boolean;
	profile: BasicProfile;
	url: string;
} => {
	const { webRelayClient, webRelayUrl } = useSlashtags2();
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
					cacheProfile2(profileUrl, pr);
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

			cacheProfile2(profileUrl, pr);
		});

		let unmounted = false;

		return (): void => {
			unsubscribe();
			unmounted = true;
		};
	}, [webRelayClient, profileUrl, shouldResolve]);

	return {
		resolving,
		profile: withContactRecord,
		url,
	};
};

export const useMigrateSlashtags2 = (): void => {
	const status = useRef({ contacts: false, profile: false });
	const oldContacts = useSlashtags().contacts;
	const newContacts = useAppSelector(contactsSelector);

	const { url: oldUrl } = useSelectedSlashtag();
	const { url, profile: slashtagsProfile, webRelayUrl } = useSlashtags2();
	const { profile: oldProfile } = useProfile(oldUrl, { resolve: true });
	const { profile: newProfile } = useProfile2(oldUrl);

	// migrate contacts
	useEffect(() => {
		if (
			status.current.contacts ||
			Object.keys(newContacts).length !== 0 ||
			Object.keys(oldContacts).length === 0
		) {
			return;
		}
		status.current.contacts = true;

		const contacts = {};

		for (const old of Object.values(oldContacts)) {
			if (!old?.name) {
				continue;
			}
			let newUrl = '';
			let id = '';
			try {
				newUrl = getNewProfileUrl(old.url, webRelayUrl);
				id = parse(newUrl).id;
			} catch (e) {
				continue;
			}
			contacts[id] = { url: newUrl, name: old.name };
		}

		addContacts(contacts);

		// ingnore newContacts here
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [oldContacts]);

	// migrate profile
	useEffect(() => {
		if (
			status.current.profile ||
			Object.keys(newProfile).length !== 0 ||
			Object.keys(oldProfile).length === 0
		) {
			return;
		}
		status.current.profile = true;

		// save everything, except image becase it can be too big
		const p = {
			bio: oldProfile.bio,
			name: oldProfile.name,
			links: oldProfile.links,
		};

		saveProfile2(url, p, slashtagsProfile);
	}, [oldProfile, newProfile, slashtagsProfile, url]);
};
