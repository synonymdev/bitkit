import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Store from '../store/types';
import {
	claimableBalanceSelector,
	openChannelsSelector,
} from '../store/reselect/lightning';
import { updateSettings } from '../store/actions/settings';
import { EUnit } from '../store/types/wallet';
import { primaryUnitSelector } from '../store/reselect/settings';
import {
	currentWalletSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';

/**
 * Retrieves wallet balances for the currently selected wallet and network.
 */
export const useBalance = (): {
	onchainBalance: number; // Total onchain funds
	lightningBalance: number; // Total lightning funds (spendable + reserved + claimable)
	spendingBalance: number; // Share of lightning funds that are spendable
	reserveBalance: number; // Share of lightning funds that are locked up in channels
	claimableBalance: number; // Funds that will be available after a channel opens/closes
	spendableBalance: number; // Total spendable funds (onchain + spendable lightning)
	totalBalance: number; // Total funds (all of the above)
} => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const currentWallet = useSelector((state: Store) => {
		return currentWalletSelector(state, selectedWallet);
	});
	const openChannels = useSelector((state: Store) => {
		return openChannelsSelector(state, selectedWallet, selectedNetwork);
	});
	const claimableBalance = useSelector((state: Store) => {
		return claimableBalanceSelector(state, selectedWallet, selectedNetwork);
	});

	// Get the total spending & reserved balance of all open channels
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

	const onchainBalance = currentWallet.balance[selectedNetwork];
	const lightningBalance = spendingBalance + reserveBalance + claimableBalance;
	const spendableBalance = onchainBalance + spendingBalance;
	const totalBalance =
		onchainBalance + spendingBalance + reserveBalance + claimableBalance;

	return {
		onchainBalance,
		lightningBalance,
		spendingBalance,
		reserveBalance,
		claimableBalance,
		spendableBalance,
		totalBalance,
	};
};

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

export const useSwitchUnit = (): [EUnit, () => void] => {
	const unit = useSelector(primaryUnitSelector);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unit === EUnit.BTC) {
			return EUnit.satoshi;
		}
		if (unit === EUnit.satoshi) {
			return EUnit.fiat;
		}
		return EUnit.BTC;
	}, [unit]);

	const switchUnit = (): void => {
		updateSettings({ unit: nextUnit });
	};

	return [nextUnit, switchUnit];
};
