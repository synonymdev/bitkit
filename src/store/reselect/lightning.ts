import { TChannel } from '@synonymdev/react-native-ldk';
import { createSelector } from '@reduxjs/toolkit';

import {
	TLightningState,
	TNode,
	TNodes,
	TOpenChannelIds,
} from '../types/lightning';
import { RootState } from '..';
import { TWalletName } from '../types/wallet';
import { reduceValue } from '../../utils/helpers';
import { EAvailableNetwork } from '../../utils/networks';
import { selectedNetworkSelector, selectedWalletSelector } from './wallet';

export const lightningState = (state: RootState): TLightningState => {
	return state.lightning;
};
export const nodesState = (state: RootState): TNodes => state.lightning.nodes;

export const accountVersionSelector = createSelector(
	lightningState,
	(lightning) => lightning.accountVersion,
);

export const nodeSelector = createSelector(
	[
		lightningState,
		(_lightning, selectedWallet: TWalletName): TWalletName => selectedWallet,
	],
	(lightning, selectedWallet): TNode => {
		return lightning.nodes[selectedWallet];
	},
);

/**
 * Returns open lightning channel ids for a given wallet and network.
 * @param {RootState} state
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
			selectedNetwork: EAvailableNetwork,
		): EAvailableNetwork => selectedNetwork,
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
			selectedNetwork: EAvailableNetwork,
		): EAvailableNetwork => selectedNetwork,
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
			selectedNetwork: EAvailableNetwork,
		): EAvailableNetwork => selectedNetwork,
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
 * @param {RootState} state
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
 * @param {RootState} state
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
 * @param {RootState} state
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
 * Returns claimable balances.
 * @param {RootState} state
 * @returns {number}
 */
export const claimableBalancesSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork) => {
		const node = lightning.nodes[selectedWallet];
		return node?.claimableBalances[selectedNetwork] ?? [];
	},
);

/**
 * Returns sum of all claimable balances.
 */
export const claimableBalanceSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork) => {
		const node = lightning.nodes[selectedWallet];
		const claimableBalances = node?.claimableBalances[selectedNetwork] ?? [];
		const result = reduceValue(claimableBalances, 'amount_satoshis');
		const claimableBalance = result.isOk() ? result.value : 0;
		return claimableBalance;
	},
);

/**
 * Returns the current lightning balance.
 */
export const lightningBalanceSelector = createSelector(
	[openChannelsSelector, claimableBalanceSelector],
	(openChannels, claimableBalance) => {
		let spendingBalance = 0;
		let reserveBalance = 0;
		openChannels.forEach((channel) => {
			if (channel.is_channel_ready) {
				const spendable = channel.outbound_capacity_sat;
				const unspendable = channel.balance_sat - spendable;
				reserveBalance += unspendable;
				spendingBalance += spendable;
			}
		});

		// TODO: filter out some types of claimable balances
		const lightningBalance =
			spendingBalance + reserveBalance + claimableBalance;

		return {
			lightningBalance,
			reserveBalance,
			claimableBalance,
			spendingBalance,
		};
	},
);

export const lightningBackupSelector = createSelector(
	[lightningState, selectedWalletSelector, selectedNetworkSelector],
	(lightning, selectedWallet, selectedNetwork) => {
		const node = lightning.nodes[selectedWallet];
		return node?.backup[selectedNetwork] ?? {};
	},
);
