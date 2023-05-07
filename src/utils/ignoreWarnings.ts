import { LogBox } from 'react-native';
import { __DISABLE_ANIMATION__ } from '../constants/env';

if (__DEV__) {
	const ignoredLogs = [];
	const ignoredInfo = [];
	const ignoredWarnings = [
		'Require cycle',
		// TEMP: ignore <Dialog /> warning on iOS
		'Modal with',
		// https://reactnavigation.org/docs/troubleshooting/#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state
		'Non-serializable values were found in the navigation state',
		// we have react-native-draggable-flatlist inside <ScrollView /> on main screen
		// unfortunalty, there is not good way to hide this error yet
		// https://github.com/computerjazz/react-native-draggable-flatlist/issues/422
		'VirtualizedLists should never be nested inside plain ScrollViews',
	];
	const ignoredErrors = [];

	// disable all logs for E2E tests running in debug mode
	if (__DISABLE_ANIMATION__) {
		LogBox.ignoreAllLogs();
	}

	const withoutIgnored = (
		logger: (...data: any[]) => void,
		ignoreList: string[],
	): any => {
		return (...args): void => {
			const output = args.join(' ');

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
