import Keychain from 'react-native-keychain';
import { err, ok, Result } from '@synonymdev/result';
import { IResponse } from './types';

export const getKeychainValue = async ({
	key,
}: {
	key: string;
}): Promise<IResponse<string>> => {
	try {
		const result = await Keychain.getGenericPassword({ service: key });
		if (!result || !result.password) {
			return { error: true, data: '' };
		}
		return { error: false, data: result.password };
	} catch (e) {
		return { error: true, data: e };
	}
};

export const setKeychainValue = async ({
	key,
	value,
}: {
	key: string;
	value: string;
}): Promise<IResponse<string>> => {
	try {
		await Keychain.setGenericPassword(key, value, { service: key });
		return { error: false, data: '' };
	} catch (e) {
		return { error: true, data: e };
	}
};

/**
 * Returns an array of all known Keychain keys.
 * @returns {Promise<string[]>}
 */
export const getAllKeychainKeys = async (): Promise<string[]> => {
	return await Keychain.getAllGenericPasswordServices();
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async ({
	key,
}: {
	key: string;
}): Promise<Result<boolean>> => {
	try {
		const result = await Keychain.resetGenericPassword({ service: key });
		return ok(result);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Wipes all known device keychain data.
 * @returns {Promise<void>}
 */
export const wipeKeychain = async (): Promise<void> => {
	const allServices = await getAllKeychainKeys();
	await Promise.all(allServices.map((key) => resetKeychainValue({ key })));
};
