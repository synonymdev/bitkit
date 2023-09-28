import './shim';
import { polyfill as polyfillFetch } from 'react-native-polyfill-globals/src/fetch';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import './src/utils/ignoreLogs';
import { AppRegistry, Text, TextInput } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './src/Root';
import { name as appName } from './app.json';

// Polyfill fetch streaming on iOS (Android is not supported yet)
// https://github.com/react-native-community/fetch/issues/13
polyfillEncoding();
polyfillReadableStream();
polyfillFetch();

// TEMP: disable font scaling globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
