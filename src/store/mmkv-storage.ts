import type { IteratorOptions } from 'level';
import { MMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';

export const storage = new MMKV();

export const reduxStorage: Storage = {
	setItem: (key, value) => {
		storage.set(key, value);
		return Promise.resolve(true);
	},
	getItem: (key) => {
		const value = storage.getString(key);
		return Promise.resolve(value);
	},
	removeItem: (key) => {
		storage.delete(key);
		return Promise.resolve();
	},
};

// Used to prevent duplicate notifications for the same txId that seems to occur when:
// - when Bitkit is brought from background to foreground
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

export class WebRelayCache {
	location: string;

	constructor(location: string) {
		this.location = `WEB-RELAY-CLIENT!${location}!`;
	}

	private getKey(key: string): string {
		return this.location + key;
	}

	async *iterator(
		opts: IteratorOptions<string, Uint8Array>,
	): AsyncIterable<[string, Uint8Array | undefined]> {
		const allKeys = await storage.getAllKeys();
		for (const key of allKeys) {
			if (!key.startsWith(this.location)) {
				continue;
			}

			const suffix = key.replace(this.location, '');

			if (opts.gt && suffix <= opts.gt) {
				continue;
			}
			if (opts.gte && suffix < opts.gte) {
				continue;
			}
			if (opts.lt && suffix >= opts.lt) {
				continue;
			}
			if (opts.lte && suffix > opts.lte) {
				continue;
			}

			const buffer = await storage.getBuffer(key);

			yield [key, buffer];
		}
	}

	async get(key: string): Promise<Uint8Array | undefined> {
		return storage.getBuffer(this.getKey(key));
	}

	async put(key: string, buffer: Uint8Array): Promise<void> {
		return storage.set(this.getKey(key), buffer);
	}

	async del(key: string): Promise<void> {
		return storage.delete(this.getKey(key));
	}

	batch(): WebRelayCache {
		return this;
	}

	write(): WebRelayCache {
		return this;
	}

	async close(): Promise<void> {}
}
