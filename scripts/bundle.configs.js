const sourceFile = './.env.production.regtest';
const targetFile = './.env.production.local';
const backupFile = targetFile + '.bak';

module.exports = {
	regtestFiles: {
		source: sourceFile,
		target: targetFile,
		backup: backupFile,
	},
};
