import { TServer } from 'beignet';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { initialSettingsState } from '../shapes/settings';
import {
	ETransactionSpeed,
	ICustomElectrumPeer,
	TChest,
	TCoinSelectPreference,
	TReceiveOption,
	TTheme,
} from '../types/settings';
import { EAvailableNetwork } from '../../utils/networks';
import { EDenomination, EUnit } from '../types/wallet';

export type TSettings = {
	enableAutoReadClipboard: boolean;
	enableSendAmountWarning: boolean;
	enableSwipeToHideBalance: boolean;
	pin: boolean;
	pinOnLaunch: boolean;
	pinOnIdle: boolean;
	pinForPayments: boolean;
	biometrics: boolean;
	rbf: boolean;
	theme: TTheme;
	unit: EUnit;
	denomination: EDenomination;
	customElectrumPeers: Record<EAvailableNetwork, TServer[]>;
	rapidGossipSyncUrl: string;
	selectedCurrency: string;
	selectedLanguage: string;
	coinSelectAuto: boolean;
	coinSelectPreference: TCoinSelectPreference;
	receivePreference: TReceiveOption[];
	enableOfflinePayments: boolean;
	showWidgets: boolean;
	showWidgetTitles: boolean;
	transactionSpeed: ETransactionSpeed;
	customFeeRate: number;
	hideBalance: boolean;
	hideBalanceOnOpen: boolean;
	hideOnboardingMessage: boolean;
	enableDevOptions: boolean;
	treasureChests: TChest[];
	orangeTickets: string[];
	webRelay: string;
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: initialSettingsState,
	reducers: {
		updateSettings: (state, action: PayloadAction<Partial<TSettings>>) => {
			state = Object.assign(state, action.payload);
		},
		addElectrumPeer: (
			state,
			action: PayloadAction<{
				peer: ICustomElectrumPeer;
				network: EAvailableNetwork;
			}>,
		) => {
			state.customElectrumPeers[action.payload.network].unshift(
				action.payload.peer,
			);
		},
		addTreasureChest: (state, action: PayloadAction<TChest>) => {
			state.treasureChests.push(action.payload);
		},
		updateTreasureChest: (state, action: PayloadAction<TChest>) => {
			const { chestId } = action.payload;
			const current = state.treasureChests.find((c) => c.chestId === chestId);
			const updatedChest = { ...current, ...action.payload };

			// replace old data while keeping the order
			state.treasureChests = state.treasureChests.map((chest) => {
				return chest === current ? updatedChest : chest;
			});
		},
		addOrangeTicket: (state, action: PayloadAction<string>) => {
			state.orangeTickets.push(action.payload);
		},
		resetSettingsState: () => initialSettingsState,
	},
});

const { actions, reducer } = settingsSlice;

export const {
	updateSettings,
	addElectrumPeer,
	addTreasureChest,
	updateTreasureChest,
	addOrangeTicket,
	resetSettingsState,
} = actions;

export default reducer;
