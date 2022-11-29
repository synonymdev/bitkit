import { AppRegistry, LogBox, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './Root';
import { name as appName } from './app.json';

// TEMP: disable font scaling for globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

LogBox.ignoreLogs([
	'Require cycle',
	// TEMP: ignore <Dialog /> warning on iOS
	'Modal with',
	// we have react-native-draggable-flatlist inside <ScrollView /> on main screen
	// unfortunalty, there is not good way to hide this error yet
	// https://github.com/computerjazz/react-native-draggable-flatlist/issues/422
	'VirtualizedLists should never be nested inside plain ScrollViews',
]);

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
