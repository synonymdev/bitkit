import { configureStore, Middleware } from '@reduxjs/toolkit';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import {
	persistReducer,
	persistStore,
	createMigrate,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';

import {
	__ENABLE_MIGRATION_DEBUG__,
	__ENABLE_REDUX_IMMUTABLE_CHECK__,
	__ENABLE_REDUX_LOGGER__,
	__JEST__,
} from '../constants/env';
import mmkvStorage from './mmkv-storage';
import rootReducer, { RootReducer } from './reducers';
import migrations from './migrations';

const devMiddleware: Middleware[] = [];
if (__ENABLE_REDUX_LOGGER__) {
	const { logger } = require('redux-logger');
	devMiddleware.push(logger);
}

const persistConfig = {
	key: 'root',
	storage: mmkvStorage,
	// increase version after store shape changes
	version: 43,
	stateReconciler: autoMergeLevel2,
	blacklist: ['receive', 'ui'],
	migrate: createMigrate(migrations, { debug: __ENABLE_MIGRATION_DEBUG__ }),
};

const persisted = persistReducer<RootReducer>(persistConfig, rootReducer);

const store = configureStore({
	reducer: persisted,
	middleware: (getDefaultMiddleware) => {
		const defaultMiddleware = getDefaultMiddleware({
			// specifically ignore redux-persist action types
			// https://redux-toolkit.js.org/usage/usage-guide#use-with-redux-persist
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
			// if things are slow in development disable this
			// https://github.com/reduxjs/redux-toolkit/issues/415
			immutableCheck: __ENABLE_REDUX_IMMUTABLE_CHECK__,
		});

		if (__DEV__ && !__JEST__) {
			return defaultMiddleware.concat(devMiddleware);
		} else {
			return defaultMiddleware;
		}
	},
	enhancers: (getDefaultEnhancers) => {
		if (__DEV__ && !__JEST__) {
			const Reactotron = require('../../ReactotronConfig').default;
			return getDefaultEnhancers().concat(Reactotron.createEnhancer());
		} else {
			return getDefaultEnhancers();
		}
	},
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
