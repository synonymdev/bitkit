import { storage } from '.';

const PREFIX = 'widget_';

export const widgetsCache = {
	set<T>(key: string, data: T): void {
		storage.set(PREFIX + key, JSON.stringify(data));
	},

	get<T>(key: string): T | null {
		const stored = storage.getString(PREFIX + key);
		if (!stored) return null;
		try {
			return JSON.parse(stored);
		} catch {
			return null;
		}
	},

	clear(): void {
		const keys = storage.getAllKeys();
		console.log({ keys });
		for (const key of keys) {
			if (key.startsWith(PREFIX)) {
				storage.delete(key);
			}
		}
	},
};
