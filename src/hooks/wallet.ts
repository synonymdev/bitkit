import { useSelector } from 'react-redux';
import Store from '../store/types';
import { IDisplayValues } from '../utils/exchange-rate/types';
import useDisplayValues from './displayValues';

export interface IncludeBalances {
	onchain?: boolean;
	lightning?: boolean;
	subtractReserveBalance?: boolean;
}

/**
 * Retrieves the total wallet display values for the currently selected wallet and network.
 */
export function useBalance({
	onchain = false,
	lightning = false,
	subtractReserveBalance = true, // Will subtract any reserved sats from the balance total by default.
}: IncludeBalances): IDisplayValues {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const b = useSelector((store: Store) => {
		let balance = 0;

		if (onchain) {
			balance +=
				store.wallet?.wallets[selectedWallet]?.balance[selectedNetwork] ?? 0;
		}

		if (lightning) {
			const openChannelIds =
				store.lightning.nodes[selectedWallet]?.openChannelIds[selectedNetwork];
			const channels =
				store.lightning.nodes[selectedWallet]?.channels[selectedNetwork];
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
		}

		return balance;
	});

	return useDisplayValues(b);
}

/**
 * Returs true, if current wallet has no transactions
 */
export function useNoTransactions(): boolean {
	const empty = useSelector((store: Store) => {
		const wallet = store.wallet.selectedWallet;
		const network = store.wallet.selectedNetwork;
		if (wallet && store.wallet?.wallets[wallet]) {
			const transactions =
				store.wallet?.wallets[wallet]?.transactions[network] ?? {};
			return Object.keys(transactions).length === 0;
		}
		return true;
	});

	return empty;
}
