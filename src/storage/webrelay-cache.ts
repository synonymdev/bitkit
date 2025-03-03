import type { IteratorOptions } from 'level';
import { storage } from '.';

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

	clear(): void {
		const keys = storage.getAllKeys();
		keys.forEach((key) => {
			if (key.includes('WEB-RELAY-CLIENT')) {
				storage.delete(key);
			}
		});
	}

	async close(): Promise<void> {}
}
