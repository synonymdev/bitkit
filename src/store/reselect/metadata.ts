import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IMetadata, TLastUsedTags, TTags } from '../types/metadata';

const metadataState = (state: Store): IMetadata => state.metadata;

export const tagsSelector = createSelector(
	[metadataState],
	(metadata): TTags => metadata.tags,
);
export const lastUsedTagsSelector = createSelector(
	[metadataState],
	(metadata): TLastUsedTags => metadata.lastUsedTags,
);
