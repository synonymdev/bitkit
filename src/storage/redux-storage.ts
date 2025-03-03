import { Storage } from 'redux-persist';
import { storage } from '.';

export const reduxStorage: Storage = {
	setItem: (key, value): Promise<boolean> => {
		storage.set(key, value);
		return Promise.resolve(true);
	},
	getItem: (key): Promise<string | undefined> => {
		const value = storage.getString(key);
		return Promise.resolve(value);
	},
	removeItem: (key): Promise<void> => {
		storage.delete(key);
		return Promise.resolve();
	},
};
