/* eslint-disable @typescript-eslint/explicit-function-return-type */
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const fs = require('fs');
const { regtestFiles } = require('./bundle.configs');

if (process.env.CI) {
	console.log('Script not meant to be run in CI, exiting...');
	return;
}

const { target: targetFile, backup: backupFile } = regtestFiles;

async function removeLocalEnvFile() {
	const targetExists = fs.existsSync(targetFile);
	if (targetExists) {
		console.log(`Removing '${targetFile}' file...`);
		await exec(`rm ${targetFile}`);
	}
}

async function restoreBackupLocalEnvFileIfExists() {
	const backupExists = fs.existsSync(backupFile);
	if (backupExists) {
		console.log(`Restoring '${backupFile}' to '${targetFile}'...`);
		await exec(`cp ${backupFile} ${targetFile}`);
		console.log(`Removing backup file '${backupFile}'...`);
		await exec(`rm ${backupFile}`);
	}
}

(async function () {
	await removeLocalEnvFile();
	await restoreBackupLocalEnvFileIfExists();
})();
