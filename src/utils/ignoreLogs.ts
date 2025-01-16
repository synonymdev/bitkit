import { LogBox } from 'react-native';
import { __E2E__, __ENABLE_LDK_LOGS__ } from '../constants/env';

if (__DEV__) {
	const ignoredLogs: string[] = [];
	const ignoredInfo: string[] = [];
	const ignoredWarnings: string[] = ['Require cycle'];
	const ignoredErrors: string[] = [];

	// disable all logs for E2E tests running in debug mode
	if (__E2E__) {
		LogBox.ignoreAllLogs();
	}

	if (!__ENABLE_LDK_LOGS__) {
		ignoredLogs.push('LDK:', 'react-native-ldk:', 'DEBUG (JS)', 'ERROR (JS)');
	}

	const withoutIgnored = (
		logger: (...data: any[]) => void,
		ignoreList: string[],
	): any => {
		return (...args): void => {
			let output: string;
			try {
				output = args.join(' ');
			} catch (_err) {
				// if we can't check if the log should be ignored, just log it
				logger(...args);
				return;
			}

			if (!ignoreList.some((log) => output.includes(log))) {
				logger(...args);
			}
		};
	};

	console.log = withoutIgnored(console.log, ignoredLogs);
	console.info = withoutIgnored(console.info, ignoredInfo);
	console.warn = withoutIgnored(console.warn, ignoredWarnings);
	console.error = withoutIgnored(console.error, ignoredErrors);
}
