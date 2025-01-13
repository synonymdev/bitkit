import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { initialBackupState } from '../shapes/backup';
import { EActivityType } from '../types/activity';
import { EBackupCategory } from '../utils/backup';
import { updateActivityItems } from './activity';
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
import { addTransfer, removeTransfer, updateTransfer } from './wallet';
import { deleteWidget, setFeedWidget } from './widgets';

export const backupSlice = createSlice({
	name: 'backup',
	initialState: initialBackupState,
	reducers: {
		resetBackupState: () => initialBackupState,
		requireBackup: (state, action: PayloadAction<EBackupCategory>) => {
			state[action.payload].required = Date.now();
		},
		backupStart: (
			state,
			action: PayloadAction<{ category: EBackupCategory }>,
		) => {
			const { category } = action.payload;
			state[category].running = true;
		},
		backupSuccess: (
			state,
			action: PayloadAction<{ category: EBackupCategory }>,
		) => {
			const { category } = action.payload;
			state[category].running = false;
			state[category].synced = Date.now();
		},
		backupError: (
			state,
			action: PayloadAction<{ category: EBackupCategory }>,
		) => {
			const { category } = action.payload;
			state[category].running = false;
		},
		forceBackup: (
			state,
			action: PayloadAction<{ category: EBackupCategory }>,
		) => {
			const { category } = action.payload;
			state[category].required = Date.now();
			state[category].running = true;
		},
	},
	extraReducers: (builder) => {
		const blocktankReducer = (state): void => {
			state[EBackupCategory.blocktank].required = Date.now();
		};
		const metadataReducer = (state): void => {
			state[EBackupCategory.metadata].required = Date.now();
		};
		const settingsReducer = (state): void => {
			state[EBackupCategory.settings].required = Date.now();
		};
		const slashtagsReducer = (state): void => {
			state[EBackupCategory.slashtags].required = Date.now();
		};
		const walletReducer = (state): void => {
			state[EBackupCategory.wallet].required = Date.now();
		};
		const widgetsReducer = (state): void => {
			state[EBackupCategory.widgets].required = Date.now();
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
			.addCase(addTransfer, walletReducer)
			.addCase(updateTransfer, walletReducer)
			.addCase(removeTransfer, walletReducer)
			.addCase(setFeedWidget, widgetsReducer)
			.addCase(deleteWidget, widgetsReducer)
			.addCase(updateActivityItems, (state, action) => {
				// we only listen for LN activity here
				const hasLnActivity = action.payload.some(
					(item) => item.activityType === EActivityType.lightning,
				);
				if (hasLnActivity) {
					state[EBackupCategory.ldkActivity].required = Date.now();
				}
			});
	},
});

const { actions, reducer } = backupSlice;

export const {
	resetBackupState,
	requireBackup,
	backupStart,
	backupSuccess,
	backupError,
	forceBackup,
} = actions;

export default reducer;
