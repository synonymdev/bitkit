import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { TMetadataState, TPendingInvoice, TTags } from '../types/metadata';
import { TReceiveState, updateInvoice } from './receive';

export const initialMetadataState: TMetadataState = {
	tags: {},
	lastUsedTags: [],
	pendingInvoices: [],
	slashTagsUrls: {},
	comments: {},
};

export const metadataSlice = createSlice({
	name: 'metadata',
	initialState: initialMetadataState,
	reducers: {
		updateMetadata: (state, action: PayloadAction<Partial<TMetadataState>>) => {
			state = Object.assign(state, action.payload);
		},
		updateMetaTxTags: (
			state,
			action: PayloadAction<{ txId: string; tags: string[] }>,
		) => {
			if (action.payload.tags.length === 0) {
				delete state.tags[action.payload.txId];
			} else {
				state.tags[action.payload.txId] = action.payload.tags;
			}
		},
		updateMetaTxComment: (
			state,
			action: PayloadAction<{ txId: string; comment: string }>,
		) => {
			if (action.payload.comment.length === 0) {
				delete state.comments[action.payload.txId];
			} else {
				state.comments[action.payload.txId] = action.payload.comment;
			}
		},
		addMetaTxTag: (
			state,
			action: PayloadAction<{ txId: string; tag: string }>,
		) => {
			let txTags = state.tags[action.payload.txId] ?? [];
			txTags = [...new Set([...txTags, action.payload.tag])];
			state.tags[action.payload.txId] = txTags;

			// add to last used tags
			const tags = [...new Set([action.payload.tag, ...state.lastUsedTags])];
			state.lastUsedTags = tags.slice(0, 10);
		},
		deleteMetaTxTag: (
			state,
			action: PayloadAction<{ txId: string; tag: string }>,
		) => {
			let txTags = state.tags[action.payload.txId] ?? [];
			txTags = txTags.filter((t) => t !== action.payload.tag);

			if (txTags.length === 0) {
				delete state.tags[action.payload.txId];
			} else {
				state.tags[action.payload.txId] = txTags;
			}
		},
		updatePendingInvoice: (
			state,
			action: PayloadAction<{
				id: string;
				tags: string[];
				address: string;
				payReq?: string;
			}>,
		) => {
			const newInvoice = { ...action.payload, timestamp: Date.now() };
			// remove duplicates
			const filtered = state.pendingInvoices.filter((invoice) => {
				return invoice.id !== action.payload.id;
			});
			state.pendingInvoices = [...filtered, newInvoice];
		},
		deletePendingInvoice: (state, action: PayloadAction<string>) => {
			const filtered = state.pendingInvoices.filter((invoice) => {
				return invoice.id !== action.payload;
			});
			state.pendingInvoices = filtered;
		},
		moveMetaIncTxTag: (
			state,
			action: PayloadAction<{
				pendingInvoices: TPendingInvoice[];
				tags: TTags;
			}>,
		) => {
			state.pendingInvoices = action.payload.pendingInvoices;
			state.tags = { ...state.tags, ...action.payload.tags };
		},
		addMetaTxSlashtagsUrl: (
			state,
			action: PayloadAction<{ txId: string; url: string }>,
		) => {
			state.slashTagsUrls[action.payload.txId] = action.payload.url;
		},
		deleteMetaTxSlashtagsUrl: (state, action: PayloadAction<string>) => {
			delete state.slashTagsUrls[action.payload];
		},
		addLastUsedTag: (state, action: PayloadAction<string>) => {
			const tags = [...new Set([action.payload, ...state.lastUsedTags])];
			state.lastUsedTags = tags.slice(0, 10);
		},
		deleteLastUsedTag: (state, action: PayloadAction<string>) => {
			const filtered = state.lastUsedTags.filter((t) => t !== action.payload);
			state.lastUsedTags = filtered;
		},
		resetMetadataState: () => initialMetadataState,
	},
	extraReducers: (builder) => {
		builder.addCase(
			updateInvoice,
			(state, action: PayloadAction<Partial<TReceiveState>>) => {
				// add to last used tags
				let tags = action.payload.tags ?? [];
				tags = [...new Set([...tags, ...state.lastUsedTags])];
				state.lastUsedTags = tags.slice(0, 10);
			},
		);
	},
});

const { actions, reducer } = metadataSlice;

export const {
	updateMetadata,
	updateMetaTxTags,
	updateMetaTxComment,
	addMetaTxTag,
	deleteMetaTxTag,
	updatePendingInvoice,
	deletePendingInvoice,
	moveMetaIncTxTag,
	addMetaTxSlashtagsUrl,
	deleteMetaTxSlashtagsUrl,
	addLastUsedTag,
	deleteLastUsedTag,
	resetMetadataState,
} = actions;

export default reducer;
