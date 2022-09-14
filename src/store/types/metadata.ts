export interface IMetadata {
	tags: { [name: string]: Array<string> };
	pendingTags: { [name: string]: Array<string> };
	lastUsedTags: Array<string>;
	slashTagsUrls: { [txId: string]: string };
}
