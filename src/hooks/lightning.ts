import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TChannel } from '@synonymdev/react-native-ldk';

import { ellipsis } from '../utils/helpers';
import Store from '../store/types';
import { TUseChannelBalance } from '../store/types/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';
import {
	channelsSelector,
	openChannelsSelector,
	openChannelIdsSelector,
} from '../store/reselect/lightning';
import { usePaidBlocktankOrders } from './blocktank';
import { IBtOrder } from '@synonymdev/blocktank-lsp-http-client';

/**
 * Returns the lightning balance of all known open channels.
 * @param {boolean} [includeReserveBalance] Whether or not to include each channel's reserve balance (~1% per channel participant) in the returned balance.
 * @returns {{ localBalance: number; remoteBalance: number; }}
 */
export const useLightningBalance = (
	includeReserveBalance = true,
): {
	localBalance: number;
	remoteBalance: number;
} => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const openChannelIds = useSelector(openChannelIdsSelector);
	const channels = useSelector((state: Store) => {
		return channelsSelector(state, selectedWallet, selectedNetwork);
	});
	const openChannels = useSelector(openChannelsSelector);

	const localBalance = useMemo(() => {
		return openChannels.reduce((acc, channel) => {
			if (!includeReserveBalance) {
				return acc + channel.outbound_capacity_sat;
			} else {
				return (
					acc +
					channel.outbound_capacity_sat +
					(channel.unspendable_punishment_reserve ?? 0)
				);
			}
		}, 0);
	}, [openChannels, includeReserveBalance]);

	const remoteBalance = useMemo(() => {
		return Object.values(channels).reduce((acc, cur) => {
			if (openChannelIds.includes(cur.channel_id)) {
				if (!includeReserveBalance) {
					return acc + cur.inbound_capacity_sat;
				} else {
					return (
						acc +
						cur.inbound_capacity_sat +
						(cur.unspendable_punishment_reserve ?? 0)
					);
				}
			}
			return acc;
		}, 0);
	}, [channels, includeReserveBalance, openChannelIds]);

	return { localBalance, remoteBalance };
};

/**
 * Returns channel balance information for a given channel.
 * @param {TChannel} channel
 * @returns {TUseChannelBalance}
 */
export const useLightningChannelBalance = (
	channel: TChannel,
): TUseChannelBalance => {
	const balance: TUseChannelBalance = {
		spendingTotal: 0, // How many sats the user has reserved in the channel. (Outbound capacity + Punishment Reserve)
		spendingAvailable: 0, // How much the user is able to spend from a channel. (Outbound capacity - Punishment Reserve)
		receivingTotal: 0, // How many sats the counterparty has reserved in the channel. (Inbound capacity + Punishment Reserve)
		receivingAvailable: 0, // How many sats the user is able to receive in a channel. (Inbound capacity - Punishment Reserve)
		capacity: 0, // Total capacity of the channel. (spendingTotal + receivingTotal)
	};

	const channel_value_satoshis = channel.channel_value_satoshis;
	const unspendable_punishment_reserve =
		channel.unspendable_punishment_reserve ?? 0;
	const outbound_capacity_sat = channel.outbound_capacity_sat;
	const balance_sat = channel.balance_sat;
	const inbound_capacity_sat = channel.inbound_capacity_sat;

	balance.spendingTotal =
		outbound_capacity_sat + unspendable_punishment_reserve;
	balance.spendingAvailable = outbound_capacity_sat;
	balance.receivingTotal =
		channel_value_satoshis - balance_sat + unspendable_punishment_reserve;
	balance.receivingAvailable = inbound_capacity_sat;
	balance.capacity = channel_value_satoshis;

	return balance;
};

/**
 * Returns the maximum inbound capacity of all known open channels.
 * @returns {number}
 */
export const useLightningMaxInboundCapacity = (): number => {
	const openChannels = useSelector(openChannelsSelector);

	const maxInboundCapacity = useMemo(() => {
		return openChannels.reduce((max, channel) => {
			const inbound = channel.inbound_capacity_sat;
			return inbound > max ? inbound : max;
		}, 0);
	}, [openChannels]);

	return maxInboundCapacity;
};

/**
 * Returns the name of a channel.
 * @param {TChannel} channel
 * @param {IBtOrder} blocktankOrder
 * @returns {string}
 */
export const useLightningChannelName = (
	channel: TChannel,
	blocktankOrder?: IBtOrder,
): string => {
	const paidBlocktankOrders = usePaidBlocktankOrders();

	if (blocktankOrder) {
		const index = paidBlocktankOrders.findIndex(
			(order) => order.id === blocktankOrder.id,
		);
		return `Connection ${index + 1}`;
	} else {
		const shortChannelId = ellipsis(channel.channel_id, 10);
		return channel.inbound_scid_alias ?? shortChannelId;
	}
};
