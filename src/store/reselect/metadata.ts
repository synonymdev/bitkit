import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import {
	IMetadata,
	TLastUsedTags,
	TSlashTagsUrls,
	TTags,
} from '../types/metadata';

const metadataState = (state: Store): IMetadata => state.metadata;

export const tagsSelector = createSelector(
	[metadataState],
	(metadata): TTags => metadata.tags,
);
export const tagSelector = createSelector(
	[metadataState, (_metadata, id: string): string => id],
	(metadata, id): string[] => metadata.tags[id] ?? [],
);
export const lastUsedTagsSelector = createSelector(
	[metadataState],
	(metadata): TLastUsedTags => metadata.lastUsedTags,
);
export const slashTagsUrlsSelector = createSelector(
	[metadataState],
	(metadata): TSlashTagsUrls => metadata?.slashTagsUrls,
);
export const slashTagsUrlSelector = createSelector(
	[metadataState, (_metadata, id: string): string => id],
	(metadata, id): string | undefined => {
		return metadata.slashTagsUrls[id];
	},
);
