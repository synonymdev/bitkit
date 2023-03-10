import cloneDeep from 'lodash.clonedeep';

import { IMetadata } from '../types/metadata';

export const defaultMetadataShape: IMetadata = {
	tags: {},
	pendingTags: {},
	lastUsedTags: [],
	slashTagsUrls: {},
};

export const getDefaultMetadataShape = (): IMetadata => {
	return cloneDeep(defaultMetadataShape);
};
