import { AnyAction, CombinedState, combineReducers } from 'redux';
import { storage } from '../mmkv-storage';
import actions from '../actions/actions';
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

const appReducer = combineReducers({
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
});

const rootReducer = (
	state: ReturnType<typeof appReducer> | undefined,
	action: AnyAction,
): CombinedState<ReturnType<typeof appReducer>> => {
	if (action.type === actions.WIPE_APP) {
		console.log('Wiping app data...');
		// Clear mmkv persisted storage
		storage.clearAll();
		// Reset all stores
		return appReducer(undefined, action);
	}

	return appReducer(state, action);
};

export default rootReducer;
