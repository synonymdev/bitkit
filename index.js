import './shim';
import { AppRegistry, LogBox, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './Root';
import { name as appName } from './app.json';
import { __DISABLE_LOOP_ANIMATION__ } from './src/constants/env';

// TEMP: disable font scaling for globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

if (__DEV__) {
	const ignoreList = [
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

	// ignore warnings
	LogBox.ignoreLogs(ignoreList);

	// disable all logs for E2E tests running in debug mode
	if (__DISABLE_LOOP_ANIMATION__) {
		LogBox.ignoreAllLogs();
	}

	// ignore errors
	const errorWarn = global.console.error;
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	global.console.error = (...arg) => {
		for (const error of ignoreList) {
			if (arg[0]?.startsWith?.(error)) {
				return;
			}
		}
		errorWarn(...arg);
	};
}

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
