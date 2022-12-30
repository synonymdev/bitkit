export type TTags = { [txId: string]: string[] };
export type TPendingTags = { [address: string]: string[] };
export type TLastUsedTags = string[];
export type TSlashTagsUrls = { [txId: string]: string | undefined };

export interface IMetadata {
	tags: TTags;
	pendingTags: TPendingTags;
	lastUsedTags: TLastUsedTags;
	slashTagsUrls: TSlashTagsUrls;
}
