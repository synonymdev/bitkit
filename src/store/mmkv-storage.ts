import { MMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';
import { initializeMMKVFlipper } from 'react-native-mmkv-flipper-plugin';
import { ENABLE_MMKV_FLIPPER } from '@env';

export const storage = new MMKV();

const __enableFlipperPlugin__ = ENABLE_MMKV_FLIPPER
	? ENABLE_MMKV_FLIPPER === 'true'
	: __DEV__;

if (__enableFlipperPlugin__) {
	initializeMMKVFlipper({ default: storage });
}

const mmkvStorage: Storage = {
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

export default mmkvStorage;
