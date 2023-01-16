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

	const logsPath = `${RNFS.DocumentDirectoryPath}/ldk/${lm.account.name}/logs`;
	const tempPath = `${logsPath}/share`;
	const zipPath = `${tempPath}/${fileName}.zip`;

	const logs = await listLogs(logsPath, limit);

	//Copy to dir to be zipped
	try {
		await rm(tempPath);
		await mkdir(tempPath);
		for (let index = 0; index < logs.length; index++) {
			const logPath = logs[index];
			let filename = logPath.substring(logPath.lastIndexOf('/') + 1);
			await copyFile(logPath, `${tempPath}/${filename}`);
		}

		await zip(logs, zipPath);

		//Cleanup duplicate logs after zips
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
			(a.mtime ?? new Date()).getTime() - (b.mtime ?? new Date()).getTime()
		);
	});

	return list.slice(0, limit).map((f) => f.path);
};
