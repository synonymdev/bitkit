import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { enableScreens, enableFreeze } from 'react-native-screens';
import { Provider } from 'react-redux';
import { EventEmitter } from 'events';

import App from './App';
import ErrorBoundary from './ErrorBoundary';
import store, { persistor } from './store';

EventEmitter.defaultMaxListeners = 1000; // default is 10, but we need to listen a lot of address

enableScreens(true);
enableFreeze(true);

const Root = (): ReactElement => {
	return (
		<ErrorBoundary>
			<Provider store={store}>
				<PersistGate
					loading={<View style={styles.container} />}
					persistor={persistor}>
					<App />
				</PersistGate>
			</Provider>
		</ErrorBoundary>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
	},
});

export default Root;
