// NOTE: import order matters

import './shim';
import './src/utils/fetch';
import './src/utils/ignoreLogs';

import { AppRegistry, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './src/Root';
import { name as appName } from './app.json';
import './src/utils/fetch-polyfill';

// TEMP: disable font scaling globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
