import { UnknownAction, combineReducers } from 'redux';

import { storage } from '../../storage';
import actions from '../actions/actions';
import activity from '../slices/activity';
import backup from '../slices/backup';
import blocktank from '../slices/blocktank';
import checks from '../slices/checks';
import fees from '../slices/fees';
import lightning from '../slices/lightning';
import metadata from '../slices/metadata';
import receive from '../slices/receive';
import settings from '../slices/settings';
import slashtags from '../slices/slashtags';
import todos from '../slices/todos';
import ui from '../slices/ui';
import user from '../slices/user';
import wallet from '../slices/wallet';
import widgets from '../slices/widgets';

const appReducer = combineReducers({
	activity,
	backup,
	blocktank,
	checks,
	fees,
	lightning,
	metadata,
	receive,
	settings,
	slashtags,
	todos,
	ui,
	user,
	wallet,
	widgets,
});

const rootReducer = (
	state: ReturnType<typeof appReducer> | undefined,
	action: UnknownAction,
): ReturnType<typeof appReducer> => {
	if (action.type === actions.WIPE_APP) {
		console.log('Wiping app data...');
		// Clear MMKV persisted storage
		storage.clearAll();
		// Reset all stores
		return appReducer(undefined, action);
	}

	return appReducer(state, action);
};

export type RootReducer = ReturnType<typeof rootReducer>;

export default rootReducer;
