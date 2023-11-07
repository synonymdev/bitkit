import cloneDeep from 'lodash/cloneDeep';

import { IMetadata } from '../types/metadata';

export const defaultMetadataShape: IMetadata = {
	tags: {},
	lastUsedTags: [],
	pendingInvoices: [],
	slashTagsUrls: {},
};

export const getDefaultMetadataShape = (): IMetadata => {
	return cloneDeep(defaultMetadataShape);
};
