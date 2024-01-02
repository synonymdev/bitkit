/* eslint-disable @typescript-eslint/explicit-function-return-type */
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const fs = require('fs');
const { regtestFiles } = require('./bundle.configs');

if (process.env.CI) {
	console.log('Script not meant to be run in CI, exiting...');
	return;
}

const {
	source: sourceFile,
	target: targetFile,
	backup: backupFile,
} = regtestFiles;

// Create backup environment file if it exists
async function backupLocalEnvFileIfExists() {
	const targetExists = fs.existsSync(targetFile);
	if (targetExists) {
		console.log(`File '${targetFile}' found, backing up to '${backupFile}'...`);
		await exec(`cp ${targetFile} ${backupFile}`);
	}
}

async function createLocalEnvFileForRegtest() {
	console.log(`Creating temp '${targetFile}' file from '${sourceFile}'...`);
	await exec(`cp ${sourceFile} ${targetFile}`);
}

(async function () {
	await backupLocalEnvFileIfExists();
	await createLocalEnvFileForRegtest();
})();
