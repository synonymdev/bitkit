export type TTags = { [name: string]: Array<string> };
export type TPendingTags = { [name: string]: Array<string> };
export type TLastUsedTags = Array<string>;
export type TSlashTagsUrls = { [txId: string]: string };

export interface IMetadata {
	tags: TTags;
	pendingTags: TPendingTags;
	lastUsedTags: TLastUsedTags;
	slashTagsUrls: TSlashTagsUrls;
}
