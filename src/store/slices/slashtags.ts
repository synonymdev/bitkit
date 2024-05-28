import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { parse } from '@synonymdev/slashtags-url';
import {
	TSlashtagsState,
	BasicProfile,
	Link,
	LocalLink,
	TOnboardingProfileStep,
} from '../types/slashtags';

export const initialSlashtagsState: TSlashtagsState = {
	contacts: {},
	lastPaidContacts: [],
	links: [],
	onboardedContacts: false,
	onboardingProfileStep: 'Intro',
	profilesCache: {},
};

export const slashtagsSlice = createSlice({
	name: 'slashtags',
	initialState: initialSlashtagsState,
	reducers: {
		setOnboardingProfileStep: (
			state,
			action: PayloadAction<TOnboardingProfileStep>,
		) => {
			state.onboardingProfileStep = action.payload;
		},
		setOnboardedContacts: (state, action: PayloadAction<boolean>) => {
			state.onboardedContacts = action.payload;
		},
		setLinks: (state, action: PayloadAction<LocalLink[]>) => {
			state.links = action.payload;
		},
		addLink: (state, action: PayloadAction<Link>) => {
			const { title, url } = action.payload;
			state.links.push({ id: `${title}:${url}`, title, url });
		},
		editLink: (state, action: PayloadAction<LocalLink>) => {
			const edited = state.links.map((link) => {
				return link.id === action.payload.id ? action.payload : link;
			});
			state.links = edited;
		},
		deleteLink: (state, action: PayloadAction<string>) => {
			state.links = state.links.filter((link) => link.id !== action.payload);
		},
		addContact: (
			state,
			action: PayloadAction<{ url: string; name: string }>,
		) => {
			const { id } = parse(action.payload.url);
			state.contacts[id] = {
				name: action.payload.name,
				url: action.payload.url,
			};
		},
		addContacts: (
			state,
			action: PayloadAction<TSlashtagsState['contacts']>,
		) => {
			state.contacts = action.payload;
		},
		deleteContact: (state, action: PayloadAction<string>) => {
			const { id } = parse(action.payload);
			delete state.contacts[id];
		},
		updateLastPaidContacts: (state, action: PayloadAction<string>) => {
			const lastPaidContacts = [
				...new Set([action.payload, ...state.lastPaidContacts]),
			];
			state.lastPaidContacts = lastPaidContacts.slice(0, 3);
		},
		cacheProfile: (
			state,
			action: PayloadAction<{ url: string; profile: BasicProfile }>,
		) => {
			const { id } = parse(action.payload.url);
			state.profilesCache[id] = action.payload.profile;
		},
		resetSlashtagsState: () => initialSlashtagsState,
	},
});

const { actions, reducer } = slashtagsSlice;

export const {
	setOnboardingProfileStep,
	setOnboardedContacts,
	setLinks,
	addLink,
	editLink,
	deleteLink,
	addContact,
	addContacts,
	deleteContact,
	updateLastPaidContacts,
	cacheProfile,
	resetSlashtagsState,
} = actions;

export default reducer;
