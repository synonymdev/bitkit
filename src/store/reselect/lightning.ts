import Store from '../types';
import { ILightning, TNodes, TOpenChannelIds } from '../types/lightning';
import { createSelector } from '@reduxjs/toolkit';
import { TAvailableNetworks } from '../../utils/networks';

export const lightningState = (state: Store): ILightning => state.lightning;
export const nodesState = (state: Store): TNodes => state.lightning.nodes;

export const lightningSelector = createSelector(
	lightningState,
	(lightning): ILightning => lightning,
);

/**
 * Returns the current lightning balance for a given wallet.
 * @param {Store} state
 * @param {string} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @param {boolean} subtractReserveBalance
 * @returns {number}
 */
export const lightningBalanceSelector = createSelector(
	[
		lightningState,
		(lightning, selectedWallet: string): string => selectedWallet,
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

/**
 * Returns open lightning channel ids for a given wallet and network.
 * @param {Store} state
 * @param {string} selectedWallet
 * @param {TAvailableNetworks} selectedNetwork
 * @returns {TOpenChannelIds}
 */
export const openChannelIdsSelector = createSelector(
	[
		nodesState,
		(nodes, selectedWallet: string): string => selectedWallet,
		(
			nodes,
			selectedWallet,
			selectedNetwork: TAvailableNetworks,
		): TAvailableNetworks => selectedNetwork,
	],
	(nodes, selectedWallet, selectedNetwork): TOpenChannelIds =>
		nodes[selectedWallet].openChannelIds[selectedNetwork],
);
