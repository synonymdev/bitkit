import { createSelector } from '@reduxjs/toolkit';
import { TClaimableBalance } from '@synonymdev/react-native-ldk';

import {
	TChannel,
	EChannelStatus,
	TLightningState,
	TNode,
	TNodes,
	EChannelClosureReason,
} from '../types/lightning';
import { RootState } from '..';
import { reduceValue } from '../../utils/helpers';
import { selectedWalletSelector, selectedNetworkSelector } from './wallet';
import { blocktankOrderSelector } from './blocktank';

export const lightningState = (state: RootState): TLightningState => {
	return state.lightning;
};
export const nodesState = (state: RootState): TNodes => state.lightning.nodes;

export const pendingPaymentsSelector = createSelector(
	[lightningState],
	(lightning) => lightning.pendingPayments,
);

export const nodeSelector = createSelector(
	[lightningState, selectedWalletSelector],
	(lightning, selectedWallet): TNode => {
		return lightning.nodes[selectedWallet];
	},
);

export const channelsSelector = createSelector(
	[nodeSelector, selectedNetworkSelector],
	(node, selectedNetwork): { [key: string]: TChannel } => {
		return node.channels[selectedNetwork];
	},
);

/**
 * Returns channel information for the provided channel ID.
 */
export const channelSelector = createSelector(
	[channelsSelector, (_state, channelId: string): string => channelId],
	(channels, channelId): TChannel => {
		return channels[channelId];
	},
);

/**
 * Returns all open lightning channels.
 * @param {RootState} state
 * @returns {TChannel[]}
 */
export const openChannelsSelector = createSelector(
	[channelsSelector],
	(channels): TChannel[] => {
		return Object.values(channels).filter((channel) => {
			return channel.status === EChannelStatus.open;
		});
	},
);

/**
 * Returns all pending lightning channels.
 * @param {RootState} state
 * @returns {TChannel[]}
 */
export const pendingChannelsSelector = createSelector(
	[channelsSelector],
	(channels): TChannel[] => {
		return Object.values(channels).filter((channel) => {
			return channel.status === EChannelStatus.pending;
		});
	},
);

/**
 * Returns all closed lightning channels.
 * @param {RootState} state
 * @returns {TChannel[]}
 */
export const closedChannelsSelector = createSelector(
	[channelsSelector],
	(channels): TChannel[] => {
		return Object.values(channels).filter((channel) => {
			return channel.status === EChannelStatus.closed;
		});
	},
);

/**
 * Returns the summed up size of all open and pending channels.
 * @param {RootState} state
 * @returns {number}
 */
export const channelsSizeSelector = createSelector(
	[openChannelsSelector, pendingChannelsSelector],
	(openChannels, pendingChannels) => {
		const openResult = reduceValue(openChannels, 'channel_value_satoshis');
		const pendingResult = reduceValue(
			pendingChannels,
			'channel_value_satoshis',
		);

		const openChannelsSize = openResult.isOk() ? openResult.value : 0;
		const pendingChannelsSize = pendingResult.isOk() ? pendingResult.value : 0;
		const channelSize = openChannelsSize + pendingChannelsSize;

		return channelSize;
	},
);

/**
 * Returns sum of claimable balances from all force closed channels.
 * We are only interested in force closed channels since funds from mutual closes are included in the onchain balance.
 */
export const claimableBalanceSelector = createSelector(
	[closedChannelsSelector],
	(closedChannels) => {
		const forceClosed = closedChannels.filter((channel) => {
			return (
				channel.closureReason &&
				[
					EChannelClosureReason.HolderForceClosed,
					EChannelClosureReason.CounterpartyForceClosed,
				].includes(channel.closureReason)
			);
		});

		const claimableBalances = forceClosed.reduce(
			(acc: TClaimableBalance[], channel) => {
				return acc.concat(channel.claimable_balances);
			},
			[],
		);

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
			const spendable = channel.outbound_capacity_sat;
			const unspendable = channel.balance_sat - spendable;
			reserveBalance += unspendable;
			spendingBalance += spendable;
		});

		const lightningBalance = spendingBalance + reserveBalance;

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

/**
 * Find the channel that corresponds to the provided order.
 */
export const channelForOrderSelector = createSelector(
	[openChannelsSelector, blocktankOrderSelector],
	(openChannels, order) => {
		const channel = openChannels.find((c) => {
			return order.channel?.fundingTx.id === c.funding_txid;
		});
		return channel;
	},
);
