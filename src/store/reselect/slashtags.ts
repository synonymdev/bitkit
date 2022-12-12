import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import {
	ISlashtags,
	LocalLink,
	TOnboardingProfileStep,
} from '../types/slashtags';

const slashtagsState = (state: Store): ISlashtags => state.slashtags;

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
