import { AppRegistry, Text } from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Root from './Root';
import { name as appName } from './app.json';

// TEMP: disable font scaling for globally
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

AppRegistry.registerComponent(appName, () => gestureHandlerRootHOC(Root));
