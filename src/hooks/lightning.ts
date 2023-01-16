import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TChannel } from '@synonymdev/react-native-ldk';

import { ellipse } from '../utils/helpers';
import Store from '../store/types';
import { TUseChannelBalance } from '../store/types/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';
import {
	channelSelector,
	channelsSelector,
	isChannelReadySelector,
	nodeSelector,
	openChannelIdsSelector,
} from '../store/reselect/lightning';

/**
 * Returns the lightning balance of all known open and pending channels.
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
	const openChannelIds = useSelector((state: Store) =>
		openChannelIdsSelector(state, selectedWallet, selectedNetwork),
	);
	const channels = useSelector((state: Store) =>
		channelsSelector(state, selectedWallet, selectedNetwork),
	);
	const openChannels = useSelector((state: Store) =>
		isChannelReadySelector(state, selectedWallet, selectedNetwork),
	);

	const localBalance = useMemo(() => {
		return Object.values(channels).reduce((acc, cur) => {
			if (openChannels.includes(cur.channel_id)) {
				if (!includeReserveBalance) {
					return acc + cur.outbound_capacity_sat;
				} else {
					return (
						acc +
						cur.outbound_capacity_sat +
						(cur?.unspendable_punishment_reserve ?? 0)
					);
				}
			}
			return acc;
		}, 0);
	}, [channels, includeReserveBalance, openChannels]);

	const remoteBalance = useMemo(() => {
		return Object.values(channels).reduce((acc, cur) => {
			if (openChannelIds.includes(cur.channel_id)) {
				if (!includeReserveBalance) {
					return acc + cur.inbound_capacity_sat;
				} else {
					return (
						acc +
						cur.inbound_capacity_sat +
						(cur?.unspendable_punishment_reserve ?? 0)
					);
				}
			}
			return acc;
		}, 0);
	}, [channels, includeReserveBalance, openChannelIds]);

	return { localBalance, remoteBalance };
};

/**
 * Returns channel balance information for a given channelId.
 * @param {string} channelId
 * @returns {TUseChannelBalance}
 */
export const useLightningChannelBalance = (
	channelId: string,
): TUseChannelBalance => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const balance: TUseChannelBalance = {
		spendingTotal: 0, // How many sats the user has reserved in the channel. (Outbound capacity + Punishment Reserve)
		spendingAvailable: 0, // How much the user is able to spend from a channel. (Outbound capacity - Punishment Reserve)
		receivingTotal: 0, // How many sats the counterparty has reserved in the channel. (Inbound capacity + Punishment Reserve)
		receivingAvailable: 0, // How many sats the user is able to receive in a channel. (Inbound capacity - Punishment Reserve)
		capacity: 0, // Total capacity of the channel. (spendingTotal + receivingTotal)
	};

	const channel = useSelector((state: Store) => {
		return channelSelector(state, selectedWallet, selectedNetwork, channelId);
	});

	if (!channelId || !channel) {
		return balance;
	}
	const channel_value_satoshis = channel?.channel_value_satoshis ?? 0;
	const unspendable_punishment_reserve =
		channel?.unspendable_punishment_reserve ?? 0;
	const outbound_capacity_sat = channel?.outbound_capacity_sat ?? 0;
	const balance_sat = channel?.balance_sat ?? 0;
	const inbound_capacity_sat = channel?.inbound_capacity_sat ?? 0;

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
 * Returns the name of a channel given its channelId.
 * @param {string} channelId
 * @returns {string}
 */
export const useLightningChannelName = (channelId: string): string => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const channel = useSelector((state: Store) => {
		return channelSelector(state, selectedWallet, selectedNetwork, channelId);
	});
	const blocktankNodeKey = useSelector((state: Store) => {
		return state.blocktank.info.node_info.public_key;
	});

	const isBlocktankChannel = channel.counterparty_node_id === blocktankNodeKey;
	const shortChannelId = ellipse(channel?.channel_id, 13);

	if (isBlocktankChannel) {
		return `Blocktank ${channel?.inbound_scid_alias ?? shortChannelId}`;
	} else {
		return channel?.inbound_scid_alias ?? channel?.channel_id
			? channel?.channel_id
			: 'Unknown Channel';
	}
};

/**
 * Returns channel data for the provided channelId.
 * @param {string} channelId
 * @returns {TChannel}
 */
export const useLightningChannelData = (channelId: string): TChannel => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	return useSelector((state: Store) => {
		return channelSelector(state, selectedWallet, selectedNetwork, channelId);
	});
};

export const useClaimableBalance = (): number => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const node = useSelector((state: Store) => {
		return nodeSelector(state, selectedWallet);
	});

	if ('claimableBalance' in node) {
		return node?.claimableBalance[selectedNetwork] ?? 0;
	}
	return 0;
};
