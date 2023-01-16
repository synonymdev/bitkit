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

export const lightningState = (state: Store): ILightning => state.lightning;
export const nodesState = (state: Store): TNodes => state.lightning.nodes;

export const lightningSelector = createSelector(
	lightningState,
	(lightning): ILightning => lightning,
);

/**
 * Returns the current lightning balance for a given wallet.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {boolean} subtractReserveBalance
 * @returns {number}
 */
export const lightningBalanceSelector = createSelector(
	[
		lightningState,
		(lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			lightning,
			selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
		(
			lightning,
			selectedWallet,
			selectedNetwork,
			subtractReserveBalance: boolean,
		): boolean => subtractReserveBalance,
	],
	(
		lightning,
		selectedWallet,
		selectedNetwork,
		subtractReserveBalance,
	): number => {
		let balance = 0;
		const openChannelIds =
			lightning.nodes[selectedWallet]?.openChannelIds[selectedNetwork];
		const channels = lightning.nodes[selectedWallet]?.channels[selectedNetwork];
		balance = Object.values(channels).reduce(
			(previousValue, currentChannel) => {
				if (
					currentChannel?.is_channel_ready &&
					openChannelIds.includes(currentChannel?.channel_id)
				) {
					let reserveBalance = 0;
					if (subtractReserveBalance) {
						reserveBalance =
							currentChannel?.unspendable_punishment_reserve ?? 0;
					}
					return previousValue + currentChannel.balance_sat - reserveBalance;
				}
				return previousValue;
			},
			balance,
		);
		return balance;
	},
);

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
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {TOpenChannelIds}
 */
export const openChannelIdsSelector = createSelector(
	[
		lightningState,
		(_nodes, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): TOpenChannelIds =>
		lightning?.nodes[selectedWallet]?.openChannelIds[selectedNetwork] ?? [],
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
			lightning?.nodes[selectedWallet]?.openChannelIds[selectedNetwork] ?? [];
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
 * Returns all open lightning channel ids that are ready.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {TOpenChannelIds}
 */
export const isChannelReadySelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): string[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];
		return openChannelIds.filter((channelId) => {
			const channel = channels[channelId];
			return channel?.is_channel_ready;
		});
	},
);

/**
 * Returns all pending lightning channel ids.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {string[]}
 */
export const pendingChannelsSelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): string[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];
		return openChannelIds.filter((channelId) => {
			const channel = channels[channelId];
			return !channel?.is_channel_ready;
		});
	},
);

/**
 * Returns all closed lightning channel ids.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {string[]}
 */
export const closedChannelsSelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): string[] => {
		const node = lightning.nodes[selectedWallet];
		const channels = node.channels[selectedNetwork];
		const allChannelKeys = Object.keys(channels);
		const openChannelIds = node.openChannelIds[selectedNetwork] ?? [];
		return allChannelKeys.filter((key) => {
			return !openChannelIds.includes(key);
		});
	},
);

/**
 * Returns claimable balance.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {number}
 */
export const claimableBalanceSelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
		(
			_lightning,
			_selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(lightning, selectedWallet, selectedNetwork): number => {
		const node = lightning.nodes[selectedWallet];
		return node?.claimableBalance[selectedNetwork] ?? 0;
	},
);
