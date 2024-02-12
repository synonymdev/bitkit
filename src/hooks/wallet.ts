import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
	claimableBalanceSelector,
	openChannelsSelector,
} from '../store/reselect/lightning';
import { updateSettings } from '../store/slices/settings';
import { unitSelector, nextUnitSelector } from '../store/reselect/settings';
import {
	currentWalletSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';
import { useCurrency } from './displayValues';
import i18n from '../utils/i18n';
import { showToast } from '../utils/notifications';
import { ignoresSwitchUnitToastSelector } from '../store/reselect/user';
import { ignoreSwitchUnitToast } from '../store/slices/user';
import { EUnit } from '../store/types/wallet';

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
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const currentWallet = useAppSelector((state) => {
		return currentWalletSelector(state, selectedWallet);
	});
	const openChannels = useAppSelector(openChannelsSelector);
	const claimableBalance = useAppSelector(claimableBalanceSelector);

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
	const empty = useAppSelector((store) => {
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

export const useSwitchUnit = (): (() => void) => {
	const dispatch = useAppDispatch();
	const nextUnit = useAppSelector(nextUnitSelector);

	const switchUnit = (): void => {
		dispatch(updateSettings({ unit: nextUnit }));
	};

	return switchUnit;
};

export const useSwitchUnitAnnounced = (): (() => void) => {
	const dispatch = useAppDispatch();
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const ignoresSwitchUnitToast = useAppSelector(ignoresSwitchUnitToastSelector);
	const { fiatTicker } = useCurrency();
	const { t } = useTranslation('wallet');

	const toUnitText = (u: EUnit): string => {
		if (u === EUnit.BTC) {
			return i18n.t('settings:general.unit_bitcoin');
		}

		return fiatTicker;
	};

	const switchUnitAnnounced = (): void => {
		switchUnit();
		if (!ignoresSwitchUnitToast) {
			showToast({
				type: 'info',
				title: t('balance_unit_switched_title', { unit: toUnitText(nextUnit) }),
				description: t('balance_unit_switched_message', {
					unit: toUnitText(unit),
				}),
			});
			dispatch(ignoreSwitchUnitToast());
		}
	};

	return switchUnitAnnounced;
};
