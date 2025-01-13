import { Result, err, ok } from '@synonymdev/result';
import RNFS from 'react-native-fs';
import { zipWithPassword } from 'react-native-zip-archive';

const backupFilePrefix = 'backpack_wallet_';

/**
 * Creates a full backup and saves to local file
 * @return {Promise<Result<string>>}
 */
export const createBackupFile = async (
	encryptionPassword?: string,
): Promise<Result<string>> => {
	const time = new Date().getTime();

	try {
		const backupDir = `${RNFS.DocumentDirectoryPath}/${backupFilePrefix}${time}`;

		await RNFS.mkdir(backupDir);

		const filePath = `${backupDir}/${`${backupFilePrefix}${time}`}.json`;

		await RNFS.writeFile(filePath, 'TODO backup bytes', 'utf8');

		if (!encryptionPassword) {
			return ok(filePath);
		}

		const encryptedFilePath = `${
			RNFS.DocumentDirectoryPath
		}/${`${backupFilePrefix}${time}`}.zip`;
		await zipWithPassword(backupDir, encryptedFilePath, encryptionPassword);

		await RNFS.unlink(backupDir);

		return ok(encryptedFilePath);
	} catch (e) {
		return err(e);
	}
};

/**
 * Removes all local backup files
 * @return {Promise<Result<string>>}
 */
export const cleanupBackupFiles = async (): Promise<Result<string>> => {
	const list = await RNFS.readDir(RNFS.DocumentDirectoryPath);

	try {
		for (let index = 0; index < list.length; index++) {
			const file = list[index];

			if (file.name.indexOf(backupFilePrefix) > -1) {
				await RNFS.unlink(file.path);
			}
		}

		return ok('Files removed');
	} catch (e) {
		return err(e);
	}
};
