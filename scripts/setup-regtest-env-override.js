/* eslint-disable @typescript-eslint/explicit-function-return-type */
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

const sourceFile = './.env.production.regtest';
const targetFile = './.env.production.local';

async function createLocalEnvFileForRegtest() {
	console.log(`Creating env '${targetFile}' file from '${sourceFile}'...`);
	await exec(`cp ${sourceFile} ${targetFile}`);
}

(async () => await createLocalEnvFileForRegtest())();
