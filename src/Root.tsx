import { EventEmitter } from 'events';
import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import App from './App';
import ErrorBoundary from './ErrorBoundary';
import store, { persistor } from './store';

EventEmitter.defaultMaxListeners = 1000; // default is 10, but we need to listen a lot of address

enableScreens(true);
enableFreeze(true);

const Root = (): ReactElement => {
	return (
		<ErrorBoundary>
			<GestureHandlerRootView>
				<Provider store={store}>
					<PersistGate
						loading={<View style={styles.container} />}
						persistor={persistor}>
						<App />
					</PersistGate>
				</Provider>
			</GestureHandlerRootView>
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
