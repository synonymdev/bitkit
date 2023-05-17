const exec = require('child_process').exec;
const fs = require('fs');
const os = require('os');

const devEnvFile = './.env.development';
const createDevEnvFile = 'cp .env.development.template .env.development';

//Create development environment file if it doesn't exist
fs.access(devEnvFile, fs.constants.F_OK, (err) => {
	if (err && !process.env.CI) {
		console.log(`File '${devEnvFile}' not found, running createDevEnv...`);
		exec(createDevEnvFile);
	}
});

let baseCommand = `
yarn install --no-audit --prefer-offline --production=true --cwd nodejs-assets/nodejs-project &&
rn-nodeify --install buffer,stream,assert,events,crypto,vm,process --hack`;

if (os.type() === 'Darwin') {
	baseCommand  += '&& react-native setup-ios-permissions';
	if (!process.env.CI) {
		baseCommand += '&& pod install --project-directory=ios';
	}
}

exec(baseCommand);
