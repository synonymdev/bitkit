import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ECoinSelectPreference, TServer } from 'beignet';

import { EAvailableNetwork } from '../../utils/networks';
import { initialSettingsState } from '../shapes/settings';
import {
	ETransactionSpeed,
	ICustomElectrumPeer,
	TChest,
	TReceiveOption,
	TTheme,
} from '../types/settings';
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
	coinSelectPreference: ECoinSelectPreference;
	receivePreference: TReceiveOption[];
	enableDevOptions: boolean;
	enableOfflinePayments: boolean;
	enableQuickpay: boolean;
	quickpayAmount: number;
	showWidgets: boolean;
	showWidgetTitles: boolean;
	transactionSpeed: ETransactionSpeed;
	customFeeRate: number;
	hideBalance: boolean;
	hideBalanceOnOpen: boolean;
	hideOnboardingMessage: boolean;
	treasureChests: TChest[];
	orangeTickets: string[];
	webRelay: string;
	quickpayIntroSeen: boolean;
	shopIntroSeen: boolean;
	transferIntroSeen: boolean;
	spendingIntroSeen: boolean;
	savingsIntroSeen: boolean;
	max_dust_htlc_exposure_type?: 'fixed_limit' | 'fee_rate_multiplier';
	max_dust_htlc_exposure?: number;
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
