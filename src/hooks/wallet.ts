import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
	claimableBalanceSelector,
	lightningBalanceSelector,
	pendingPaymentsSelector,
} from '../store/reselect/lightning';
import { updateSettings } from '../store/slices/settings';
import { unitSelector, nextUnitSelector } from '../store/reselect/settings';
import {
	currentWalletSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
	transfersSelector,
} from '../store/reselect/wallet';
import { useCurrency } from './displayValues';
import i18n from '../utils/i18n';
import { showToast } from '../utils/notifications';
import { ignoresSwitchUnitToastSelector } from '../store/reselect/user';
import { ignoreSwitchUnitToast } from '../store/slices/user';
import { EUnit } from '../store/types/wallet';
import { newChannelsNotificationsSelector } from '../store/reselect/todos';

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
	pendingPaymentsBalance: number; // LN funds that have not been claimed by payee (hold invoices)
	balanceInTransfer: number; // Funds that are currently in transfer
	balanceInTransferToSpending: number;
	balanceInTransferToSavings: number;
	totalBalance: number; // Total funds (all of the above)
} => {
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const currentWallet = useAppSelector((state) => {
		return currentWalletSelector(state, selectedWallet);
	});
	const transfers = useAppSelector(transfersSelector);
	const pendingPayments = useAppSelector(pendingPaymentsSelector);
	const claimableBalance = useAppSelector(claimableBalanceSelector);
	const newChannels = useAppSelector(newChannelsNotificationsSelector);
	const { lightningBalance, spendingBalance, reserveBalance } = useAppSelector(
		lightningBalanceSelector,
	);

	const onchainBalance = currentWallet.balance[selectedNetwork];
	const spendableBalance = onchainBalance + spendingBalance;
	const pendingPaymentsBalance = pendingPayments.reduce(
		(acc, payment) => acc + payment.amount,
		0,
	);

	let inTransferToSpending = transfers.reduce((acc, transfer) => {
		if (transfer.type === 'open' && transfer.status === 'pending') {
			return acc + transfer.amount;
		}
		return acc;
	}, 0);
	let inTransferToSavings = transfers.reduce((acc, transfer) => {
		if (transfer.type === 'coop-close' && transfer.status === 'pending') {
			return acc + transfer.amount;
		}
		return acc;
	}, 0);

	const inTransfer = inTransferToSpending + inTransferToSavings;

	if (newChannels.length > 0) {
		// avoid flashing wrong balance on channel open
		inTransferToSpending = 0;
	}

	const totalBalance = onchainBalance + lightningBalance + inTransferToSpending;

	return {
		onchainBalance,
		lightningBalance,
		spendingBalance,
		reserveBalance,
		claimableBalance,
		spendableBalance,
		pendingPaymentsBalance,
		balanceInTransfer: inTransfer,
		balanceInTransferToSpending: inTransferToSpending,
		balanceInTransferToSavings: inTransferToSavings,
		totalBalance,
	};
};

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
