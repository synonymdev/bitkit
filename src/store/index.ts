import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';
import logger from 'redux-logger';
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
	__ENABLE_REDUX_FLIPPER__,
	__ENABLE_REDUX_IMMUTABLE_CHECK__,
	__ENABLE_REDUX_LOGGER__,
	__JEST__,
} from '../constants/env';
import mmkvStorage from './mmkv-storage';
import reducers, { RootReducer } from './reducers';
import migrations from './migrations';

const middleware: ConfigureStoreOptions['middleware'] = [];
const devMiddleware = [
	...(__ENABLE_REDUX_FLIPPER__ ? [createDebugger()] : []),
	...(__ENABLE_REDUX_LOGGER__ ? [logger] : []),
];

const enhancers: ConfigureStoreOptions['enhancers'] = [];

const persistConfig = {
	key: 'root',
	storage: mmkvStorage,
	// increase version after store shape changes
	version: 15,
	stateReconciler: autoMergeLevel2,
	blacklist: ['ui'],
	migrate: createMigrate(migrations, { debug: __ENABLE_MIGRATION_DEBUG__ }),
};
const persistedReducer = persistReducer<RootReducer>(persistConfig, reducers);

const store = configureStore({
	reducer: persistedReducer,
	enhancers: enhancers,
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
			return defaultMiddleware.concat([...middleware, ...devMiddleware]);
		} else {
			return defaultMiddleware.concat(middleware);
		}
	},
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
