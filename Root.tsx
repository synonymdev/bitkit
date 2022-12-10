import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { enableScreens, enableFreeze } from 'react-native-screens';
import { Provider } from 'react-redux';
import { EventEmitter } from 'events';
import nodejs from 'nodejs-mobile-react-native';

import App from './src/App';
import ErrorBoundary from './src/ErrorBoundary';
import store, { persistor } from './src/store';

EventEmitter.defaultMaxListeners = 1000; // default is 10, but we need to listen a lot of address

nodejs.start('main.js');
enableScreens(true);
enableFreeze(true);

const Root = (): ReactElement => {
	const content = (
		<Provider store={store}>
			<PersistGate
				loading={<View style={styles.container} />}
				persistor={persistor}>
				<App />
			</PersistGate>
		</Provider>
	);

	if (__DEV__) {
		return content;
	}

	return <ErrorBoundary>{content}</ErrorBoundary>;
};

export default Root;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
	},
});
