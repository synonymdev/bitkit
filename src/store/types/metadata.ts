export type TTags = { [txId: string]: string[] };
export type TLastUsedTags = string[];
export type TSlashTagsUrls = { [txId: string]: string | undefined };
export type TTxComments = { [txId: string]: string };

export type TPendingInvoice = {
	id: string; // uuid used to identify the invoice 'session'
	address: string;
	payReq?: string;
	tags: string[];
	timestamp: number; // TODO: used to remove old unpaid pending invoices;
};

export type TMetadataState = {
	tags: TTags;
	lastUsedTags: TLastUsedTags;
	// Keep track of pending invoices, right now this is only used to map tags to incoming transactions
	pendingInvoices: TPendingInvoice[];
	slashTagsUrls: TSlashTagsUrls;
	comments: TTxComments;
};
