import actions from '../actions/actions';
import { defaultBackupShape } from '../shapes/backup';
import { IBackup } from '../types/backup';

const backup = (state: IBackup = defaultBackupShape, action): IBackup => {
	switch (action.type) {
		case actions.BACKUP_UPDATE:
			return {
				...state,
				...action.payload,
			};

		case actions.UPDATE_SETTINGS:
			return {
				...state,
				remoteSettingsBackupSynced: false,
			};

		case actions.SET_SLASHTAGS_FEED_WIDGET:
			return {
				...state,
				remoteWidgetsBackupSynced: false,
			};

		case actions.RESET_BACKUP_STORE:
			return defaultBackupShape;

		default:
			return state;
	}
};

export default backup;
