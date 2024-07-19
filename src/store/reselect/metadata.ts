import { RootState } from '..';
import { createSelector } from '@reduxjs/toolkit';
import {
	TMetadataState,
	TLastUsedTags,
	TSlashTagsUrls,
	TTags,
} from '../types/metadata';

export const metadataState = (state: RootState): TMetadataState => {
	return state.metadata;
};

export const tagsSelector = createSelector(
	[metadataState],
	(metadata): TTags => metadata.tags,
);
export const tagSelector = createSelector(
	[metadataState, (_state, id: string): string => id],
	(metadata, id): string[] => metadata.tags[id] ?? [],
);
export const lastUsedTagsSelector = createSelector(
	[metadataState],
	(metadata): TLastUsedTags => metadata.lastUsedTags,
);
export const slashTagsUrlsSelector = createSelector(
	[metadataState],
	(metadata): TSlashTagsUrls => metadata.slashTagsUrls,
);
export const slashTagsUrlSelector = createSelector(
	[metadataState, (_state, id: string): string => id],
	(metadata, id): string | undefined => {
		return metadata.slashTagsUrls[id];
	},
);
