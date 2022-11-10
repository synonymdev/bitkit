import { AppRegistry, LogBox, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './Root';
import { name as appName } from './app.json';

// TEMP: disable font scaling for globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

// TEMP: ignore <Dialog /> warning on iOS
LogBox.ignoreLogs(['Modal with']);

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
