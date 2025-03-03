// Used to prevent duplicate notifications for the same txId that seems to occur when:
// - when Bitkit is brought from background to foreground

import { storage } from '.';

// - connection to electrum server is lost and then re-established
export const receivedTxIds = {
	STORAGE_KEY: 'receivedTxIds',

	// Get stored txIds
	get: (): string[] => {
		return JSON.parse(storage.getString(receivedTxIds.STORAGE_KEY) || '[]');
	},

	// Save txIds to storage
	save: (txIds: string[]): void => {
		storage.set(receivedTxIds.STORAGE_KEY, JSON.stringify(txIds));
	},

	// Add a new txId
	add: (txId: string): void => {
		const txIds = receivedTxIds.get();
		txIds.push(txId);
		receivedTxIds.save(txIds);
	},

	// Check if txId exists
	has: (txId: string): boolean => {
		const txIds = receivedTxIds.get();
		return txIds.includes(txId);
	},
};
