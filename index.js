import './shim';
import './src/utils/ignoreWarnings';
import { AppRegistry, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './Root';
import { name as appName } from './app.json';

// TEMP: disable font scaling globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
