const exec = require('child_process').exec;
const fs = require('fs');
const os = require('os');

const devEnvFile = './.env.development';
const createDevEnvFile = 'cp .env.development.template .env.development';

// Create development environment file if it doesn't exist
fs.access(devEnvFile, fs.constants.F_OK, (err) => {
	if (err && !process.env.CI) {
		console.log(`File '${devEnvFile}' not found, creating...`);
		exec(createDevEnvFile);
	}
});

let installNodeDeps = ``;

if (os.type() === 'Darwin') {
	installNodeDeps += 'react-native setup-ios-permissions';
	if (!process.env.CI) {
		installNodeDeps += '&& pod install --project-directory=ios';
	}
}

if (installNodeDeps !== '') {
    exec(installNodeDeps);
}
