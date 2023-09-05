import { createSelector } from '@reduxjs/toolkit';
import { parse } from '@synonymdev/slashtags-url';

import Store from '../types';
import {
	BasicProfile,
	IContactRecord,
	ISlashtags,
	LocalLink,
	TOnboardingProfileStep,
} from '../types/slashtags';
import { TContacts } from '../../store/types/slashtags';

const slashtagsState = (state: Store): ISlashtags => state.slashtags;

export const slashtagsSelector = (state: Store): ISlashtags => state.slashtags;

export const lastSentSelector = createSelector(
	[slashtagsState],
	(slashtags): number | undefined => slashtags.seeder?.lastSent,
);
export const onboardingProfileStepSelector = createSelector(
	[slashtagsState],
	(slashtags): TOnboardingProfileStep => slashtags.onboardingProfileStep,
);

export const slashtagsLinksSelector = createSelector(
	[slashtagsState],
	(slashtags): LocalLink[] => slashtags.links,
);

export const onboardedContactsSelector = createSelector(
	[slashtagsState],
	(slashtags): boolean => slashtags.onboardedContacts,
);

export const contactsSelector = createSelector(
	[slashtagsState],
	(slashtags): TContacts => slashtags.contacts,
);

export const contactSelector = createSelector(
	[slashtagsState, (_slashtagsItems, url: string): string => url],
	(slashtags, url): IContactRecord | undefined => {
		const { id } = parse(url);
		return slashtags.contacts?.[id];
	},
);

export const profilesCacheSelector = createSelector(
	[slashtagsState],
	(
		slashtags,
	): {
		[id: string]: BasicProfile;
	} => slashtags.profilesCache,
);

export const profileCacheSelector = createSelector(
	[slashtagsState, (_slashtagsItems, url: string): string => url],
	(slashtags, url): BasicProfile | {} => {
		const { id } = parse(url);
		return slashtags.profilesCache?.[id] ?? {};
	},
);
