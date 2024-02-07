import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
	TBackupStateUpdate,
	TClaimableBalance,
} from '@synonymdev/react-native-ldk';

import { initialLightningState } from '../shapes/lightning';
import { EAvailableNetwork } from '../../utils/networks';
import { TWalletName } from '../types/wallet';
import {
	TChannels,
	TLdkAccountVersion,
	TLightningNodeVersion,
} from '../types/lightning';

export const lightningSlice = createSlice({
	name: 'lightning',
	initialState: initialLightningState,
	reducers: {
		updateLightningNodeId: (
			state,
			action: PayloadAction<{
				nodeId: string;
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { nodeId, selectedWallet, selectedNetwork } = action.payload;
			state.nodes[selectedWallet].nodeId[selectedNetwork] = nodeId;
		},
		updateLightningNodeVersion: (
			state,
			action: PayloadAction<TLightningNodeVersion>,
		) => {
			state.version = action.payload;
		},
		updateLightningChannels: (
			state,
			action: PayloadAction<{
				channels: TChannels;
				openChannelIds: string[];
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { channels, openChannelIds, selectedWallet, selectedNetwork } =
				action.payload;
			state.nodes[selectedWallet].channels[selectedNetwork] = {
				...state.nodes[selectedWallet].channels[selectedNetwork],
				...channels,
			};
			state.nodes[selectedWallet].openChannelIds[selectedNetwork] =
				openChannelIds;
		},
		saveLightningPeer: (
			state,
			action: PayloadAction<{
				peer: string;
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { peer, selectedWallet, selectedNetwork } = action.payload;
			state.nodes[selectedWallet].peers[selectedNetwork].push(peer);
		},
		removeLightningPeer: (
			state,
			action: PayloadAction<{
				peer: string;
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { selectedWallet, selectedNetwork } = action.payload;
			let filtered = state.nodes[selectedWallet].peers[selectedNetwork].filter(
				(peer) => peer !== action.payload.peer,
			);
			state.nodes[selectedWallet].peers[selectedNetwork] = filtered;
		},
		updateClaimableBalances: (
			state,
			action: PayloadAction<{
				claimableBalances: TClaimableBalance[];
				selectedNetwork: EAvailableNetwork;
				selectedWallet: TWalletName;
			}>,
		) => {
			const { claimableBalances, selectedNetwork, selectedWallet } =
				action.payload;
			state.nodes[selectedWallet].claimableBalances[selectedNetwork] =
				claimableBalances;
		},
		updateBackupState: (
			state,
			action: PayloadAction<{
				backup: TBackupStateUpdate;
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { backup, selectedWallet, selectedNetwork } = action.payload;
			state.nodes[selectedWallet].backup[selectedNetwork] = backup;
		},
		updateLdkAccountVersion: (
			state,
			action: PayloadAction<TLdkAccountVersion>,
		) => {
			state.accountVersion = action.payload;
		},
		resetLightningState: () => initialLightningState,
	},
});

const { actions, reducer } = lightningSlice;

export const {
	updateLightningNodeId,
	updateLightningNodeVersion,
	updateLightningChannels,
	saveLightningPeer,
	removeLightningPeer,
	updateClaimableBalances,
	updateBackupState,
	updateLdkAccountVersion,
	resetLightningState,
} = actions;

export default reducer;
