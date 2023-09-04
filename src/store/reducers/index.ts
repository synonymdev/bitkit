import { AnyAction, CombinedState, combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { storage } from '../mmkv-storage';
import actions from '../actions/actions';
import ui from './ui';
import user from './user';
import wallet from './wallet';
import receive from './receive';
import settings from './settings';
import lightning from './lightning';
import activity from './activity';
import backup from './backup';
import blocktank from './blocktank';
import todos from './todos';
import fees from './fees';
import metadata from './metadata';
import slashtags from './slashtags';
import widgets from './widgets';
import checks from './checks';

const appReducer = combineReducers({
	ui,
	user,
	wallet,
	receive,
	settings,
	lightning,
	activity,
	backup,
	blocktank,
	todos,
	fees,
	metadata,
	slashtags,
	widgets,
	checks,
});

const rootReducer = (
	state: ReturnType<typeof appReducer> | undefined,
	action: AnyAction,
): CombinedState<ReturnType<typeof appReducer>> => {
	if (action.type === actions.WIPE_APP) {
		console.log('Wiping app data...');
		// Clear mmkv persisted storage
		storage.clearAll();
		// Clear async storage
		AsyncStorage.clear();
		// Reset all stores
		return appReducer(undefined, action);
	}

	return appReducer(state, action);
};

export type RootReducer = ReturnType<typeof rootReducer>;

export default rootReducer;
