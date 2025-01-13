import { createSelector } from '@reduxjs/toolkit';
import { parse } from '@synonymdev/slashtags-url';

import { RootState } from '..';
import { TContacts } from '../../store/types/slashtags';
import {
	BasicProfile,
	IContactRecord,
	LocalLink,
	TOnboardingProfileStep,
	TSlashtagsState,
} from '../types/slashtags';

const slashtagsState = (state: RootState): TSlashtagsState => state.slashtags;

export const slashtagsSelector = (state: RootState): TSlashtagsState => {
	return state.slashtags;
};

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

export const lastPaidSelector = createSelector(
	[slashtagsState],
	(slashtags) => slashtags.lastPaidContacts,
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
