import { configureStore } from '@reduxjs/toolkit';
import createDebugger from 'redux-flipper';
import logger from 'redux-logger';
import {
	persistReducer,
	createMigrate,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';
import {
	ENABLE_REDUX_FLIPPER,
	ENABLE_REDUX_LOGGER,
	ENABLE_REDUX_IMMUTABLE_CHECK,
} from '@env';

import mmkvStorage from './mmkv-storage';
import reducers from './reducers';
import migrations from './migrations';

const __JEST__ = process.env.JEST_WORKER_ID !== undefined;
const __enableDebugger__ = ENABLE_REDUX_FLIPPER
	? ENABLE_REDUX_FLIPPER === 'true'
	: false;
const __enableLogger__ = ENABLE_REDUX_LOGGER
	? ENABLE_REDUX_LOGGER === 'true'
	: true;
const __enableImmutableCheck__ = ENABLE_REDUX_IMMUTABLE_CHECK
	? ENABLE_REDUX_IMMUTABLE_CHECK === 'true'
	: true;

const middleware = [];
const devMiddleware = [
	...(__enableDebugger__ ? [createDebugger()] : []),
	...(__enableLogger__ ? [logger] : []),
];

const enhancers = [];

const persistConfig = {
	key: 'root',
	storage: mmkvStorage,
	// increase version after store shape changes
	version: 1,
	migrate: createMigrate(migrations, { debug: false }),
};
const persistedReducer = persistReducer(persistConfig, reducers);

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
			immutableCheck: __enableImmutableCheck__,
		});

		if (__DEV__ && !__JEST__) {
			return defaultMiddleware.concat([...middleware, ...devMiddleware]);
		} else {
			return defaultMiddleware.concat(middleware);
		}
	},
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
