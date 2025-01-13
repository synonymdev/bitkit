import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
	TLastUsedTags,
	TMetadataState,
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
export const commentSelector = createSelector(
	[metadataState, (_state, txId: string): string => txId],
	(metadata, txId): string => metadata.comments[txId] ?? '',
);
