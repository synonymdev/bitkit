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

		case actions.UPDATE_META_TX_TAGS:
		case actions.ADD_META_TX_TAG:
		case actions.DELETE_META_TX_TAG:
		case actions.UPDATE_META_INC_TX_TAGS:
		case actions.MOVE_META_INC_TX_TAG:
		case actions.ADD_META_TX_SLASH_TAGS_URL:
		case actions.DELETE_META_TX_SLASH_TAGS_URL:
		case actions.ADD_TAG:
		case actions.DELETE_TAG:
			return {
				...state,
				remoteMetadataBackupSynced: false,
			};

		case actions.RESET_BACKUP_STORE:
			return defaultBackupShape;

		default:
			return state;
	}
};

export default backup;
