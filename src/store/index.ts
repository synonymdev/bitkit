import { createStore, applyMiddleware } from 'redux';
import reducers from './reducers';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { persistReducer } = require('redux-persist');

//Switch off logging for unit tests and prod env
const createStoreWithMiddleware = (process.env.JEST_WORKER_ID === undefined &&
	__DEV__
	? applyMiddleware(thunk, logger)
	: applyMiddleware(thunk))(createStore);

const persistConfig = {
	key: 'root',
	storage: AsyncStorage,
};
const persistedReducer = persistReducer(persistConfig, reducers);
const store = createStoreWithMiddleware(persistedReducer);

export default store;
