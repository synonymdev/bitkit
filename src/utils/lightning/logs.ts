import RNFS, { copyFile, exists, mkdir, unlink } from 'react-native-fs';
import lm from '@synonymdev/react-native-ldk';
import { zip } from 'react-native-zip-archive';
import { err, ok, Result } from '@synonymdev/result';

/**
 * Zips up the newest LDK logs and returns base64 of zip file
 * @param {number} limit
 */
export const zipLogs = async (limit: number = 10): Promise<Result<string>> => {
	const logFilePrefix = 'bitkit_ldk_logs';
	const time = new Date().getTime();
	const fileName = `${logFilePrefix}_${time}`;

	const jsonFilesPath = `${RNFS.DocumentDirectoryPath}/ldk/${lm.account.name}`;
	const logsPath = `${RNFS.DocumentDirectoryPath}/ldk/${lm.account.name}/logs`;
	const tempPath = `${logsPath}/share`;
	const zipPath = `${tempPath}/${fileName}.zip`;

	try {
		const logs = await listLogs(logsPath, limit);
		const jsonFiles = await listJsonFiles(jsonFilesPath);
		const files = [...logs, ...jsonFiles];

		//Copy to dir to be zipped
		await rm(tempPath);
		await mkdir(tempPath);

		for (let index = 0; index < files.length; index++) {
			const logPath = files[index];
			let filename = logPath.substring(logPath.lastIndexOf('/') + 1);
			await copyFile(logPath, `${tempPath}/${filename}`);
		}

		await zip(files, zipPath);

		//Cleanup duplicate files after zips
		listLogs(tempPath, limit).then((newFiles) => {
			newFiles.forEach((f) => rm(f));
		});

		return ok(zipPath);
	} catch (error) {
		return err(error);
	}
};

/**
 * Deletes a file or dir and ignores any errors
 * @param path
 * @returns {Promise<void>}
 */
const rm = async (path: string): Promise<void> => {
	try {
		if (await exists(path)) {
			await unlink(path);
		}
	} catch (e) {}
};

/**
 * Lists .log files in a given directory and returns newest files first
 * @param path
 * @param limit
 * @returns {Promise<string[]>}
 */
const listLogs = async (path: string, limit: number): Promise<string[]> => {
	let list = await RNFS.readDir(path);

	//Filter for log files only
	list = list.filter((f) => {
		return f.isFile() && f.name.indexOf('.log') > -1 && f.size > 0;
	});

	//Newest first
	list.sort((a, b) => {
		return (
			(b.mtime ?? new Date()).getTime() - (a.mtime ?? new Date()).getTime()
		);
	});

	return list.slice(0, limit).map((f) => f.path);
};

/**
 * Lists .json files in a given directory
 * @param path
 * @returns {Promise<string[]>}
 */
const listJsonFiles = async (path: string): Promise<string[]> => {
	let list = await RNFS.readDir(path);

	// Filter for .json files only
	list = list.filter((f) => {
		return f.isFile() && f.name.endsWith('json') && f.size > 0;
	});

	return list.map((f) => f.path);
};
