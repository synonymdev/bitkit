import { createSelector } from '@reduxjs/toolkit';
import {
	EAddressType,
	IBoostedTransactions,
	IFormattedTransaction,
	IFormattedTransactions,
	ISendTransaction,
	IUtxo,
	TGapLimitOptions,
} from 'beignet';

import { RootState } from '..';
import { IExchangeRates } from '../../utils/exchange-rate';
import { EAvailableNetwork } from '../../utils/networks';
import { defaultSendTransaction } from '../shapes/wallet';
import { TSettings } from '../slices/settings';
import { EFeeId } from '../types/fees';
import {
	ETransferStatus,
	IWallet,
	IWalletStore,
	IWallets,
	TWalletName,
} from '../types/wallet';

export const walletState = (state: RootState): IWalletStore => state.wallet;
export const walletsState = (state: RootState): IWallets => {
	return state.wallet.wallets;
};
export const exchangeRatesState = (state: RootState): IExchangeRates => {
	return state.wallet.exchangeRates;
};
export const selectedWalletSelector = (state: RootState): TWalletName => {
	return state.wallet.selectedWallet;
};
export const selectedNetworkSelector = (
	state: RootState,
): EAvailableNetwork => {
	return state.wallet.selectedNetwork;
};

/**
 * Returns wallet data for the currently selected wallet.
 * @param {RootState} state
 * @param {TWalletName} selectedWallet
 * @returns {IWallet}
 */
export const currentWalletSelector = createSelector(
	[
		walletState,
		(_state, selectedWallet: TWalletName): TWalletName => selectedWallet,
	],
	(wallet, selectedWallet): IWallet => {
		return wallet.wallets[selectedWallet];
	},
);

/**
 * Returns the saved gap limit options for the wallet.
 * @param {RootState} state
 * @returns {TGapLimitOptions}
 */
export const gapLimitOptionsSelector = createSelector(
	[walletState],
	(wallet): TGapLimitOptions => wallet.gapLimitOptions,
);

export const addressTypesToMonitorSelector = createSelector(
	[walletState],
	(wallet): EAddressType[] => wallet.addressTypesToMonitor,
);

/**
 * Returns the selected address type for a given wallet and network.
 * @param {RootState} state
 * @returns {EAddressType}
 */
export const addressTypeSelector = createSelector(
	[walletState],
	(wallet): EAddressType => {
		const { selectedWallet, selectedNetwork } = wallet;
		return wallet.wallets[selectedWallet]?.addressType[selectedNetwork];
	},
);

/**
 * Returns exchange rate information.
 */
export const exchangeRatesSelector = (state: RootState): IExchangeRates => {
	return state.wallet.exchangeRates;
};

/**
 * Returns exchange rate for specific fiat currency.
 */
export const exchangeRateSelector = createSelector(
	[
		exchangeRatesSelector,
		(_state, currency: TSettings['selectedCurrency']): string => currency,
	],
	(exchangeRates, currency) => {
		return exchangeRates[currency]?.rate ?? 0;
	},
);

/**
 * Returns transfers for the currently selected wallet.
 */
export const transfersSelector = createSelector([walletState], (wallet) => {
	const { selectedWallet, selectedNetwork } = wallet;
	return wallet.wallets[selectedWallet].transfers[selectedNetwork];
});

/**
 * Returns pending transfers for the currently selected wallet.
 */
export const pendingTransfersSelector = createSelector(
	[walletState],
	(wallet) => {
		const { selectedWallet, selectedNetwork } = wallet;
		const transfers = wallet.wallets[selectedWallet].transfers[selectedNetwork];
		const pendingTransfers = transfers.filter((transfer) => {
			return transfer.status === ETransferStatus.pending;
		});

		return pendingTransfers;
	},
);

/**
 * Returns transfers for the currently selected wallet.
 */
export const transferSelector = createSelector(
	[walletState, (_state, txId?: string): string | undefined => txId],
	(wallet, txId) => {
		const { selectedWallet, selectedNetwork } = wallet;
		const transfers = wallet.wallets[selectedWallet].transfers[selectedNetwork];
		const transfer = transfers.find((t) => t.txId === txId);
		return transfer;
	},
);

/**
 * Returns object of on-chain transactions for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {IFormattedTransactions}
 */
export const transactionsSelector = createSelector(
	[walletState],
	(wallet): IFormattedTransactions => {
		const { selectedWallet, selectedNetwork } = wallet;
		return wallet.wallets[selectedWallet]?.transactions[selectedNetwork] || {};
	},
);

/**
 * Returns transaction data for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {ISendTransaction}
 */
export const transactionSelector = createSelector(
	[walletState],
	(wallet): ISendTransaction => {
		const { selectedWallet, selectedNetwork } = wallet;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultSendTransaction
		);
	},
);

/**
 * Returns transaction data for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {IUtxo[]}
 */
export const transactionInputsSelector = createSelector(
	[walletState],
	(wallet): IUtxo[] => {
		const { selectedWallet, selectedNetwork } = wallet;
		const transaction =
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultSendTransaction;
		return transaction.inputs;
	},
);

/**
 * Returns transaction fee for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {ISendTransaction}
 */
export const transactionFeeSelector = createSelector(
	[walletState],
	(wallet) => {
		const { selectedWallet, selectedNetwork } = wallet;
		const { transaction } = wallet.wallets[selectedWallet];
		return transaction[selectedNetwork].fee;
	},
);

/**
 * Returns whether transaction is set to max for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {ISendTransaction}
 */
export const transactionMaxSelector = createSelector(
	[walletState],
	(wallet): boolean => {
		const { selectedWallet, selectedNetwork } = wallet;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork].max ?? false
		);
	},
);

/**
 * Returns boosted transactions for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {IBoostedTransactions}
 */
export const boostedTransactionsSelector = createSelector(
	[walletState],
	(wallet): IBoostedTransactions => {
		const { selectedWallet, selectedNetwork } = wallet;
		return (
			wallet.wallets[selectedWallet]?.boostedTransactions[selectedNetwork] || {}
		);
	},
);

/**
 * Returns unconfirmed transactions for the currently selected wallet & network.
 * @param {RootState} state
 * @returns {IFormattedTransaction[]}
 */
export const unconfirmedTransactionsSelector = createSelector(
	[walletState],
	(wallet): IFormattedTransaction[] => {
		const { selectedWallet, selectedNetwork } = wallet;
		const transactions: IFormattedTransactions =
			wallet.wallets[selectedWallet]?.transactions[selectedNetwork] || {};
		return Object.values(transactions).filter((tx) => (tx.height ?? 0) < 1);
	},
);

/**
 * Returns the wallet store object.
 */
export const walletSelector = (state: RootState): IWalletStore => state.wallet;

/**
 * Returns the current on-chain balance.
 */
export const onChainBalanceSelector = createSelector(
	[walletState],
	(wallet): number => {
		const { selectedWallet, selectedNetwork } = wallet;
		return wallet.wallets[selectedWallet]?.balance[selectedNetwork] || 0;
	},
);

export const utxosSelector = createSelector(
	[walletState],
	(wallet): IUtxo[] => {
		const { selectedWallet } = wallet;
		const selectedNetwork = wallet.selectedNetwork;
		return wallet.wallets[selectedWallet]?.utxos[selectedNetwork] || [];
	},
);

export const walletExistsSelector = createSelector(
	[walletState],
	(wallet): boolean => wallet.walletExists,
);

export const seedHashSelector = createSelector(
	[walletState],
	(wallet): string | undefined => {
		const { selectedWallet } = wallet;
		return wallet.wallets[selectedWallet]?.seedHash;
	},
);

export const selectedFeeIdSelector = createSelector(
	[walletState],
	(wallet): EFeeId => {
		const { selectedWallet, selectedNetwork } = wallet;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork]
				?.selectedFeeId ?? EFeeId.none
		);
	},
);
