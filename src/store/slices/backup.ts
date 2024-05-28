import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { initialBackupState } from '../shapes/backup';
import { EBackupCategories } from '../utils/backup';
import { addPaidBlocktankOrder, updateBlocktankOrder } from './blocktank';
import {
	addLastUsedTag,
	addMetaTxSlashtagsUrl,
	addMetaTxTag,
	deleteLastUsedTag,
	deleteMetaTxSlashtagsUrl,
	deleteMetaTxTag,
	deletePendingInvoice,
	moveMetaIncTxTag,
	updateMetaTxTags,
	updatePendingInvoice,
} from './metadata';
import { updateSettings } from './settings';
import { addContact, addContacts, deleteContact } from './slashtags';
import { setFeedWidget, deleteWidget } from './widgets';
import { updateActivityItems } from './activity';
import { EActivityType } from '../types/activity';

export const backupSlice = createSlice({
	name: 'backup',
	initialState: initialBackupState,
	reducers: {
		resetBackupState: () => initialBackupState,
		backupStart: (state, action: PayloadAction<{ category: string }>) => {
			const { category } = action.payload;
			state[category].running = true;
		},
		backupSuccess: (state, action: PayloadAction<{ category: string }>) => {
			const { category } = action.payload;
			state[category].running = false;
			state[category].synced = Date.now();
		},
		backupError: (state, action: PayloadAction<{ category: string }>) => {
			const { category } = action.payload;
			state[category].running = false;
		},
		forceBackup: (state, action: PayloadAction<{ category: string }>) => {
			const { category } = action.payload;
			state[category].required = Date.now();
			state[category].running = true;
		},
	},
	extraReducers: (builder) => {
		const blocktankReducer = (state): void => {
			state[EBackupCategories.blocktank].required = Date.now();
		};
		const metadataReducer = (state): void => {
			state[EBackupCategories.metadata].required = Date.now();
		};
		const settingsReducer = (state): void => {
			state[EBackupCategories.settings].required = Date.now();
		};
		const slashtagsReducer = (state): void => {
			state[EBackupCategories.slashtags].required = Date.now();
		};
		const widgetsReducer = (state): void => {
			state[EBackupCategories.widgets].required = Date.now();
		};

		builder
			.addCase(addPaidBlocktankOrder, blocktankReducer)
			.addCase(updateBlocktankOrder, blocktankReducer)
			.addCase(updateMetaTxTags, metadataReducer)
			.addCase(addMetaTxTag, metadataReducer)
			.addCase(deleteMetaTxTag, metadataReducer)
			.addCase(updatePendingInvoice, metadataReducer)
			.addCase(deletePendingInvoice, metadataReducer)
			.addCase(moveMetaIncTxTag, metadataReducer)
			.addCase(addMetaTxSlashtagsUrl, metadataReducer)
			.addCase(deleteMetaTxSlashtagsUrl, metadataReducer)
			.addCase(addLastUsedTag, metadataReducer)
			.addCase(deleteLastUsedTag, metadataReducer)
			.addCase(updateSettings, settingsReducer)
			.addCase(addContact, slashtagsReducer)
			.addCase(addContacts, slashtagsReducer)
			.addCase(deleteContact, slashtagsReducer)
			.addCase(setFeedWidget, widgetsReducer)
			.addCase(deleteWidget, widgetsReducer)
			.addCase(updateActivityItems, (state, action) => {
				// we only listen for LN activity here
				const hasLnActivity = action.payload.some(
					(item) => item.activityType === EActivityType.lightning,
				);
				if (hasLnActivity) {
					state[EBackupCategories.ldkActivity].required = Date.now();
				}
			});
	},
});

const { actions, reducer } = backupSlice;

export const {
	resetBackupState,
	backupStart,
	backupSuccess,
	backupError,
	forceBackup,
} = actions;

export default reducer;
