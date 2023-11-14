import RNFS, { copyFile, exists, mkdir, unlink } from 'react-native-fs';
import lm from '@synonymdev/react-native-ldk';
import { zip } from 'react-native-zip-archive';
import { err, ok, Result } from '@synonymdev/result';

/**
 * Zips up the newest LDK logs and returns base64 of zip file
 * @param {number} limit
 * @param {boolean} allAccounts
 */
export const zipLogs = async ({
	limit = 10,
	includeJson = false,
	includeBinaries = false,
	allAccounts = false,
}: {
	limit?: number;
	includeJson?: boolean;
	includeBinaries?: boolean;
	allAccounts?: boolean;
} = {}): Promise<Result<string>> => {
	const time = new Date().getTime();
	const logFilePrefix = 'bitkit_ldk_logs';
	const ldkPath = `${RNFS.DocumentDirectoryPath}/ldk`;
	const tempPath = `${RNFS.DocumentDirectoryPath}/bitkit_temp`;
	const zipFileName = `${logFilePrefix}_${time}`;
	const zipPath = `${tempPath}/${zipFileName}.zip`;

	try {
		// Create temporary folder
		await unlinkIfExists(tempPath);
		await mkdir(`${tempPath}/${zipFileName}`);

		const accounts = await listLogs({
			path: ldkPath,
			limit,
			includeJson,
			includeBinaries,
			accountName: allAccounts ? undefined : lm.account.name,
		});

		// Copy files to temporary folder to be zipped
		for (const account of accounts) {
			// Make a subfolder for each account
			const accountFolder = `${tempPath}/${zipFileName}/${account.id}`;
			await mkdir(accountFolder);

			// Copy each log file to the account folder
			for (const filePath of account.files) {
				const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
				await copyFile(filePath, `${accountFolder}/${fileName}`);
			}
		}

		// Zip up files
		const result = await zip(tempPath, zipPath);

		return ok(result);
	} catch (error) {
		return err(error);
	}
};

/**
 * Lists .log files for all LDK accounts sorted by newest first
 * @param {string} path
 * @param {number} limit
 * @param {string} [accountName]
 * @param {boolean} [includeJson]
 */
const listLogs = async ({
	path,
	limit,
	accountName,
	includeJson = false,
	includeBinaries = false,
}: {
	path: string;
	limit: number;
	accountName?: string;
	includeJson?: boolean;
	includeBinaries?: boolean;
}): Promise<{ id: string; files: string[] }[]> => {
	const ldkPathItems = await RNFS.readDir(path);
	const filter = accountName ?? 'ldkaccount';
	const accounts = ldkPathItems.filter((item) => item.path.includes(filter));

	const promises = accounts.map(async (account) => {
		const files = await listLogsForAccount(`${account.path}/logs`, limit);

		if (includeJson) {
			const jsonFiles = await listFilesForAccount({
				path: account.path,
				filter: ['.json'],
			});
			files.push(...jsonFiles);
		}

		if (includeBinaries) {
			const binFiles = await listFilesForAccount({
				path: account.path,
				filter: ['.bin'],
			});
			files.push(...binFiles);
		}

		const filePaths = files.map((f) => f.path);

		return { id: account.name, files: filePaths };
	});

	return Promise.all(promises);
};

/**
 * Lists .log files for an LDK account sorted by newest first
 * @param {string} path
 * @param {number} limit
 * @returns {Promise<RNFS.ReadDirItem[]>}
 */
const listLogsForAccount = async (
	path: string,
	limit: number,
): Promise<RNFS.ReadDirItem[]> => {
	const files = await listFilesForAccount({ path, filter: ['.log'] });

	// Sort by newest
	files.sort((a, b) => {
		const aTime = (a.mtime ?? new Date()).getTime();
		const bTime = (b.mtime ?? new Date()).getTime();
		return bTime - aTime;
	});

	// Limit number of log files
	return files.slice(0, limit);
};

/**
 * Lists files in a given directory
 * @param {string} path
 * @param {string[]} [filter]
 * @returns {Promise<RNFS.ReadDirItem[]>}
 */
const listFilesForAccount = async ({
	path,
	filter,
}: {
	path: string;
	filter?: string[];
}): Promise<RNFS.ReadDirItem[]> => {
	if (!(await exists(path))) {
		return [];
	}

	let files = await RNFS.readDir(path);

	// Filter files
	if (filter) {
		const regex = new RegExp(filter.join('|'));
		files = files.filter((f) => f.isFile() && f.size > 0 && regex.test(f.name));
	}

	return files;
};

/**
 * Deletes a file or dir and ignores any errors
 * @param path
 * @returns {Promise<void>}
 */
const unlinkIfExists = async (path: string): Promise<void> => {
	try {
		if (await exists(path)) {
			await unlink(path);
		}
	} catch (e) {}
};
