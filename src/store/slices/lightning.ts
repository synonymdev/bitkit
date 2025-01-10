import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
	TChannel as TLdkChannel,
	TBackupStateUpdate,
	TChannelMonitor,
} from '@synonymdev/react-native-ldk';

import { initialLightningState } from '../shapes/lightning';
import { EAvailableNetwork } from '../../utils/networks';
import { TWalletName } from '../types/wallet';
import {
	EChannelStatus,
	TChannel,
	TChannels,
	TLightningNodeVersion,
	TPendingPayment,
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
		updateChannels: (
			state,
			action: PayloadAction<{
				channels: TLdkChannel[];
				channelMonitors: TChannelMonitor[];
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { channels, channelMonitors, selectedWallet, selectedNetwork } =
				action.payload;

			const current = state.nodes[selectedWallet].channels[selectedNetwork];
			const updated = channels.map((channel) => {
				const existing = Object.values(current).find((c) => {
					return c.channel_id === channel.channel_id;
				});

				const channelMonitor = channelMonitors.find(({ channel_id }) => {
					return channel_id === channel.channel_id;
				});

				const status = channel.is_channel_ready
					? EChannelStatus.open
					: EChannelStatus.pending;

				return {
					...channel,
					status,
					// append channelMonitor data to channel
					claimable_balances: channelMonitor?.claimable_balances ?? [],
					// add status and createdAt (if new channel)
					createdAt: existing?.createdAt ?? new Date().getTime(),
				};
			});

			// LDK only returns open channels, so we need to compare with stored channels to find closed ones
			const closedChannels = Object.values(current)
				.filter((o) => !channels.some((i) => i.channel_id === o.channel_id))
				.map((channel) => {
					const channelMonitor = channelMonitors.find(({ channel_id }) => {
						return channel_id === channel.channel_id;
					});

					// Mark closed channels as such
					return {
						...channel,
						status: EChannelStatus.closed,
						// append channelMonitor data to channel
						claimable_balances: channelMonitor?.claimable_balances ?? [],
						is_channel_ready: false,
						is_usable: false,
					};
				});

			const allChannels = [...updated, ...closedChannels];
			// Channels come in unsorted, so we sort them by the added createdAt
			const sorted = allChannels.sort((a, b) => a.createdAt - b.createdAt);
			const channelsObject = sorted.reduce<TChannels>((acc, channel) => {
				acc[channel.channel_id] = channel;
				return acc;
			}, {});

			state.nodes[selectedWallet].channels[selectedNetwork] = channelsObject;
		},
		updateChannel: (
			state,
			action: PayloadAction<{
				channelData: Partial<TChannel>;
				selectedWallet: TWalletName;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { channelData, selectedWallet, selectedNetwork } = action.payload;
			const channels = state.nodes[selectedWallet].channels[selectedNetwork];
			const current = Object.values(channels).find((c) => {
				return c.channel_id === channelData.channel_id;
			});

			if (current) {
				const updated = { ...current, ...channelData };
				state.nodes[selectedWallet].channels[selectedNetwork][
					current.channel_id
				] = updated;
			}
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
			const filtered = state.nodes[selectedWallet].peers[
				selectedNetwork
			].filter((peer) => peer !== action.payload.peer);
			state.nodes[selectedWallet].peers[selectedNetwork] = filtered;
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
		addPendingPayment: (state, action: PayloadAction<TPendingPayment>) => {
			state.pendingPayments.push(action.payload);
		},
		removePendingPayment: (state, action: PayloadAction<string>) => {
			const filtered = state.pendingPayments.filter(
				(payment) => payment.payment_hash !== action.payload,
			);
			state.pendingPayments = filtered;
		},
		resetLightningState: () => initialLightningState,
	},
});

const { actions, reducer } = lightningSlice;

export const {
	updateLightningNodeId,
	updateLightningNodeVersion,
	updateChannels,
	updateChannel,
	saveLightningPeer,
	removeLightningPeer,
	updateBackupState,
	addPendingPayment,
	removePendingPayment,
	resetLightningState,
} = actions;

export default reducer;
