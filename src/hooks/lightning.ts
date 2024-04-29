import { useMemo } from 'react';
import { TChannel } from '@synonymdev/react-native-ldk';
import { useTranslation } from 'react-i18next';

import { ellipsis } from '../utils/helpers';
import { useAppSelector } from '../hooks/redux';
import { usePaidBlocktankOrders } from './blocktank';
import {
	channelsSelector,
	openChannelsSelector,
} from '../store/reselect/lightning';

/**
 * Returns the lightning balance of all known open channels.
 * @param {boolean} [includeReserve] Whether or not to include each channel's reserve balance (~1% per channel participant) in the returned balance.
 * @returns {{ localBalance: number; remoteBalance: number; }}
 */
export const useLightningBalance = (
	includeReserve = true,
): {
	localBalance: number;
	remoteBalance: number;
} => {
	const openChannels = useAppSelector(openChannelsSelector);

	const [localBalance, remoteBalance] = useMemo(() => {
		let local = 0;
		let remote = 0;

		openChannels.forEach((channel) => {
			const localReserve = channel.unspendable_punishment_reserve ?? 0;
			local += includeReserve
				? channel.outbound_capacity_sat + localReserve
				: channel.outbound_capacity_sat;

			remote += channel.inbound_capacity_sat;
		});

		return [local, remote];
	}, [openChannels, includeReserve]);

	return { localBalance, remoteBalance };
};

/**
 * Returns channel balance information for a given channel.
 */
export const useLightningChannelBalance = (
	channel: TChannel,
): {
	spendingTotal: number; // How many sats the user has reserved in the channel. (Outbound capacity + Punishment Reserve)
	spendingAvailable: number; // How much the user is able to spend from a channel. (Outbound capacity - Punishment Reserve)
	receivingTotal: number; // How many sats the counterparty has reserved in the channel. (Inbound capacity + Punishment Reserve)
	receivingAvailable: number; // How many sats the user is able to receive in a channel. (Inbound capacity - Punishment Reserve)
	capacity: number; // Total capacity of the channel. (spendingTotal + receivingTotal)
} => {
	const {
		channel_value_satoshis,
		balance_sat,
		outbound_capacity_sat,
		inbound_capacity_sat,
		unspendable_punishment_reserve,
	} = channel;

	// user punishment reserve balance
	const localReserve = unspendable_punishment_reserve ?? 0;

	return {
		spendingTotal: outbound_capacity_sat + localReserve,
		spendingAvailable: outbound_capacity_sat,
		receivingTotal: channel_value_satoshis - balance_sat,
		receivingAvailable: inbound_capacity_sat,
		capacity: channel_value_satoshis,
	};
};

/**
 * Returns the maximum inbound capacity of all known open channels.
 * @returns {number}
 */
export const useLightningMaxInboundCapacity = (): number => {
	const openChannels = useAppSelector(openChannelsSelector);

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
 * @returns {string}
 */
export const useLightningChannelName = (channel: TChannel): string => {
	const { t } = useTranslation('lightning');
	const channels = useAppSelector(channelsSelector);
	const paidBlocktankOrders = usePaidBlocktankOrders();

	const pendingChannels = paidBlocktankOrders.filter((order) => {
		return !Object.values(channels).find((c) => {
			return c.funding_txid === order.channel?.fundingTx.id;
		});
	});
	const pendingIndex = pendingChannels.findIndex((order) => {
		return channel.channel_id === order.id;
	});
	const channelIndex = Object.values(channels).findIndex((c) => {
		return channel.channel_id === c.channel_id;
	});

	if (channelIndex === -1) {
		if (pendingIndex === -1) {
			// If channel is found neither in open/closed channels nor in pending orders, show the channel id
			const shortChannelId = ellipsis(channel.channel_id, 10);
			return channel.inbound_scid_alias || shortChannelId;
		} else {
			const index = Object.values(channels).length + pendingIndex;
			return `${t('connection')} ${index + 1}`;
		}
	} else {
		return `${t('connection')} ${channelIndex + 1}`;
	}
};
