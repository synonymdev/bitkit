import fs from 'fs';
import path from 'path';

const LOCK_PATH = '/tmp/';

export const checkComplete = (name) => {
	if (!process.env.CI) {
		return;
	}

	if (fs.existsSync(path.join(LOCK_PATH, 'lock-' + name))) {
		console.warn('skipping', name, 'as it previously passed on CI');
		return true;
	}

	return false;
};

export const markComplete = (name) => {
	if (!process.env.CI) {
		return;
	}

	fs.writeFileSync(path.join(LOCK_PATH, 'lock-' + name), '1');
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
