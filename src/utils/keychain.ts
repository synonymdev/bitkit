import { Result, err, ok } from '@synonymdev/result';
import Keychain from 'react-native-keychain';

export const getKeychainValue = async (
	key: string,
): Promise<Result<string>> => {
	try {
		const result = await Keychain.getGenericPassword({ service: key });
		if (!result || !result.password) {
			return err('No password found');
		}
		return ok(result.password);
	} catch (e) {
		return err(e);
	}
};

export const setKeychainValue = async ({
	key,
	value,
}: {
	key: string;
	value: string;
}): Promise<Result<string>> => {
	try {
		await Keychain.setGenericPassword(key, value, { service: key });
		return ok('');
	} catch (e) {
		console.error('Error storing credentials:', e);
		return err(e);
	}
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async (
	key: string,
): Promise<Result<boolean>> => {
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
	const services = await Keychain.getAllGenericPasswordServices();
	await Promise.all(services.map((key) => resetKeychainValue(key)));
};
