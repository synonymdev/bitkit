import { useSelector } from 'react-redux';
import Store from '../store/types';
import { TChannel } from '@synonymdev/react-native-ldk';
import { TUseChannelBalance } from '../store/types/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';

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
	const openChannelIds = useSelector(
		(store: Store) =>
			store.lightning.nodes[selectedWallet].openChannelIds[selectedNetwork],
	);
	const channels = useSelector(
		(store: Store) =>
			store.lightning.nodes[selectedWallet].channels[selectedNetwork],
	);

	const openChannels = openChannelIds.filter((channelId) => {
		const channel = channels[channelId];
		return channel?.is_channel_ready;
	});

	const localBalance = Object.values(channels).reduce((acc, cur) => {
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

	const remoteBalance = Object.values(channels).reduce((acc, cur) => {
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

	return { localBalance, remoteBalance };
};

/**
 * Returns channel balance information for a given channelId.
 * @param {string} channelId
 * @returns {TUseChannelBalance}
 */
export const useLightningChannelBalance = (channelId): TUseChannelBalance => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const balance: TUseChannelBalance = {
		spendingTotal: 0, // How many sats the user has reserved in the channel. (Outbound capacity + Punishment Reserve)
		spendingAvailable: 0, // How much the user is able to spend from a channel. (Outbound capacity - Punishment Reserve)
		receivingTotal: 0, // How many sats the counterparty has reserved in the channel. (Inbound capacity + Punishment Reserve)
		receivingAvailable: 0, // How many sats the user is able to receive in a channel. (Inbound capacity - Punishment Reserve)
		capacity: 0, // Total capacity of the channel. (spendingTotal + receivingTotal)
	};

	const channel: TChannel = useSelector(
		(store: Store) =>
			store.lightning.nodes[selectedWallet]?.channels[selectedNetwork][
				channelId
			] ?? '',
	);

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
export const useLightningChannelName = (channelId): string => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const paidBlocktankOrders = useSelector(
		(store: Store) => store.blocktank.paidOrders,
	);

	const channel: TChannel = useSelector(
		(store: Store) =>
			store.lightning.nodes[selectedWallet].channels[selectedNetwork][
				channelId
			],
	);
	const paidBlocktankOrderId = Object.keys(paidBlocktankOrders).filter(
		(blocktankId) => paidBlocktankOrders[blocktankId] === channel.funding_txid,
	);

	if (paidBlocktankOrderId.length) {
		return `Blocktank Channel ${paidBlocktankOrderId[0]}`;
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
export const useLightningChannelData = (channelId): TChannel => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	return useSelector(
		(store: Store) =>
			store.lightning.nodes[selectedWallet].channels[selectedNetwork][
				channelId
			],
	);
};

export const useClaimableBalance = (): number => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const node = useSelector(
		(store: Store) => store.lightning.nodes[selectedWallet],
	);

	if ('claimableBalance' in node) {
		return node?.claimableBalance[selectedNetwork] ?? 0;
	}
	return 0;
};
