import { TChannel } from '@synonymdev/react-native-ldk';
import Store from '../types';
import {
	IDefaultLightningShape,
	ILightning,
	TNodes,
	TOpenChannelIds,
} from '../types/lightning';
import { createSelector } from '@reduxjs/toolkit';
import { TAvailableNetworks } from '../../utils/networks';
import { TWalletName } from '../types/wallet';
import { selectedNetworkSelector, selectedWalletSelector } from './wallet';

export const lightningState = (state: Store): ILightning => state.lightning;
export const nodesState = (state: Store): TNodes => state.lightning.nodes;

export const lightningSelector = createSelector(
	lightningState,
	(lightning): ILightning => lightning,
);

/**
 * Returns the current lightning balance for a given wallet.
 * CURRENTLY UNUSED
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {boolean} subtractReserveBalance
 * @returns {number}
 */
// export const lightningBalanceSelector = createSelector(
// 	[
// 		lightningState,
// 		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
// 		(
// 			_lightning,
// 			_selectedWallet,
// 			selectedNetwork: TAvailableNetworks,
// 		): TAvailableNetworks => selectedNetwork,
// 		(
// 			_lightning,
// 			_selectedWallet,
// 			_selectedNetwork,
// 			subtractReserveBalance: boolean,
// 		): boolean => subtractReserveBalance,
// 	],
// 	(
// 		lightning,
// 		selectedWallet,
// 		selectedNetwork,
// 		subtractReserveBalance,
// 	): number => {
// 		let balance = 0;
// 		const openChannelIds =
// 			lightning.nodes[selectedWallet]?.openChannelIds[selectedNetwork];
// 		const channels = lightning.nodes[selectedWallet]?.channels[selectedNetwork];
// 		balance = Object.values(channels).reduce((previousValue, channel) => {
// 			if (
// 				channel.is_channel_ready &&
// 				openChannelIds.includes(channel.channel_id)
// 			) {
// 				const channelBalance = subtractReserveBalance
// 					? channel.outbound_capacity_sat
// 					: channel.balance_sat;
// 				return previousValue + channelBalance;
// 			}
// 			return previousValue;
// 		}, balance);
// 		return balance;
// 	},
// );

export const nodeSelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
	],
	(lightning, selectedWallet): IDefaultLightningShape => {
		return lightning.nodes[selectedWallet];
	},
);

/**
 * Returns open lightning channel ids for a given wallet and network.
 * @param {Store} state
 * @returns {TOpenChannelIds}
 */
export const openChannelIdsSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork): TOpenChannelIds =>
		lightning.nodes[selectedWallet]?.openChannelIds[selectedNetwork] ?? [],
);

export const channelIsOpenSelector = createSelector(
	[
		lightningState,
		(_nodes, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
		(
			_lightning,
			_selectedWallet,
			_selectedNetwork,
			channelId: string,
		): string => channelId,
	],
	(lightning, selectedWallet, selectedNetwork, channelId): boolean => {
		const openChannelIds =
			lightning.nodes[selectedWallet]?.openChannelIds[selectedNetwork] ?? [];
		return openChannelIds.includes(channelId);
	},
);

export const channelsSelector = createSelector(
	[
		lightningState,
		(_nodes, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): { [key: string]: TChannel } =>
		lightning.nodes[selectedWallet]?.channels[selectedNetwork],
);

/**
 * Returns channel information for the provided channel ID.
 */
export const channelSelector = createSelector(
	[
		lightningState,
		(_nodes, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
		(
			_lightning,
			_selectedWallet,
			_selectedNetwork,
			channelId: string,
		): string => channelId,
	],
	(lightning, selectedWallet, selectedNetwork, channelId): TChannel =>
		lightning.nodes[selectedWallet]?.channels[selectedNetwork][channelId] ?? '',
);

/**
 * Returns all open lightning channels.
 * @param {Store} state
 * @returns {TChannel[]}
 */
export const openChannelsSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork): TChannel[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];

		return Object.values(channels).filter((channel) => {
			return (
				openChannelIds.includes(channel.channel_id) && channel?.is_channel_ready
			);
		});
	},
);

/**
 * Returns all pending lightning channels.
 * @param {Store} state
 * @returns {TChannel[]}
 */
export const pendingChannelsSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork): TChannel[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];

		return Object.values(channels).filter((channel) => {
			return (
				openChannelIds.includes(channel.channel_id) &&
				!channel?.is_channel_ready
			);
		});
	},
);

/**
 * Returns all closed lightning channels.
 * @param {Store} state
 * @returns {TChannel[]}
 */
export const closedChannelsSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork): TChannel[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];

		return Object.values(channels).filter((channel) => {
			return !openChannelIds.includes(channel.channel_id);
		});
	},
);

/**
 * Returns claimable balance.
 * @param {Store} state
 * @returns {number}
 */
export const claimableBalanceSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork): number => {
		const node = lightning.nodes[selectedWallet];
		return node?.claimableBalance[selectedNetwork] ?? 0;
	},
);
