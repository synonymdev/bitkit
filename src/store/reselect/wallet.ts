import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import {
	IWalletStore,
	IWallets,
	IWallet,
	TWalletName,
	IBoostedTransactions,
	IFormattedTransactions,
	IFormattedTransaction,
	IBitcoinTransactionData,
	IUtxo,
	IAddressTypes,
	EAddressType,
} from '../types/wallet';
import { defaultBitcoinTransactionData } from '../shapes/wallet';
import { TAvailableNetworks } from '../../utils/networks';
import { IExchangeRates } from '../../utils/exchange-rate/types';
import { EFeeId } from '../types/fees';

export const walletState = (state: Store): IWalletStore => state.wallet;
export const walletsState = (state: Store): IWallets => state.wallet.wallets;
export const exchangeRatesState = (state: Store): IExchangeRates =>
	state.wallet.exchangeRates;
export const selectedWalletState = (state: Store): TWalletName =>
	state.wallet.selectedWallet;
export const selectedNetworkState = (state: Store): TAvailableNetworks =>
	state.wallet.selectedNetwork;
export const addressTypesState = (state: Store): IAddressTypes =>
	state.wallet.addressTypes;

/**
 * Returns the selected wallet id.
 */
export const selectedWalletSelector = createSelector(
	[walletState],
	(wallet): TWalletName => wallet.selectedWallet,
);

/**
 * Returns the selected network id (TAvailableNetworks)
 */
export const selectedNetworkSelector = createSelector(
	[walletState],
	(wallet): TAvailableNetworks => wallet.selectedNetwork,
);

/**
 * Returns wallet data for the currently selected wallet.
 * @param {Store} state
 * @param {TWalletName} selectedWallet
 * @returns {IWallet}
 */
export const currentWalletSelector = createSelector(
	[
		walletState,
		(_wallet, selectedWallet: TWalletName): TWalletName => selectedWallet,
	],
	(wallet, selectedWallet): IWallet => {
		return wallet.wallets[selectedWallet];
	},
);

/**
 * Returns the selected address type for a given wallet and network.
 * @param {Store} state
 * @returns {EAddressType}
 */
export const addressTypeSelector = createSelector(
	[walletState],
	(wallet): EAddressType => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return wallet.wallets[selectedWallet]?.addressType[selectedNetwork];
	},
);

/**
 * Returns exchange rate information.
 */
export const exchangeRatesSelector = createSelector([walletState], (wallet) => {
	return wallet.exchangeRates;
});

/**
 * Returns object of on-chain transactions for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IFormattedTransactions}
 */
export const transactionsSelector = createSelector(
	[walletState],
	(wallet): IFormattedTransactions => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return wallet.wallets[selectedWallet]?.transactions[selectedNetwork] || {};
	},
);

/**
 * Returns transaction data for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IBitcoinTransactionData}
 */
export const transactionSelector = createSelector(
	[walletState],
	(wallet): IBitcoinTransactionData => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultBitcoinTransactionData
		);
	},
);

/**
 * Returns transaction data for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IUtxo[]}
 */
export const transactionInputsSelector = createSelector(
	[walletState],
	(wallet): IUtxo[] => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		const transaction =
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultBitcoinTransactionData;
		return transaction.inputs;
	},
);

/**
 * Returns transaction fee for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IBitcoinTransactionData}
 */
export const transactionFeeSelector = createSelector(
	[walletState],
	(wallet) => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork].fee ||
			defaultBitcoinTransactionData.fee
		);
	},
);

/**
 * Returns whether transaction is set to max for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IBitcoinTransactionData}
 */
export const transactionMaxSelector = createSelector(
	[walletState],
	(wallet): boolean => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork].max ?? false
		);
	},
);

/**
 * Returns boosted transactions for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IBoostedTransactions}
 */
export const boostedTransactionsSelector = createSelector(
	[walletState],
	(wallet): IBoostedTransactions => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return (
			wallet.wallets[selectedWallet]?.boostedTransactions[selectedNetwork] || {}
		);
	},
);

/**
 * Returns unconfirmed transactions for the currently selected wallet & network.
 * @param {Store} state
 * @returns {IFormattedTransaction[]}
 */
export const unconfirmedTransactionsSelector = createSelector(
	[walletState],
	(wallet): IFormattedTransaction[] => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		const transactions: IFormattedTransactions =
			wallet.wallets[selectedWallet]?.transactions[selectedNetwork] || {};
		return Object.values(transactions).filter((tx) => tx.height < 1);
	},
);

/**
 * Returns the wallet store object.
 */
export const walletSelector = (state: Store): IWalletStore => state.wallet;

/**
 * Returns the current on-chain balance.
 */
export const onChainBalanceSelector = createSelector(
	walletState,
	(wallet): number => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return wallet.wallets[selectedWallet]?.balance[selectedNetwork] || 0;
	},
);

export const utxosSelector = createSelector(walletState, (wallet): IUtxo[] => {
	const selectedWallet = wallet.selectedWallet;
	const selectedNetwork = wallet.selectedNetwork;
	return wallet.wallets[selectedWallet]?.utxos[selectedNetwork] || [];
});

export const addressTypesSelector = createSelector(
	[walletState],
	(wallet): IAddressTypes => wallet.addressTypes,
);

export const walletExistsSelector = createSelector(
	[walletState],
	(wallet): boolean => wallet.walletExists,
);

export const seedHashSelector = createSelector(
	[walletState],
	(wallet): string | undefined => {
		const selectedWallet = wallet.selectedWallet;
		return wallet.wallets[selectedWallet]?.seedHash;
	},
);

// export const changeAddressSelector = createSelector(
// 	[walletState],
// 	(wallet): IAddress => {
// 		const selectedWallet = wallet.selectedWallet;
// 		const selectedNetwork = wallet.selectedNetwork;
// 		return (
// 			wallet.wallets[selectedWallet]?.changeAddressIndex[selectedNetwork]
// 				?.address || ''
// 		);
// 	},
// );

export const selectedFeeIdSelector = createSelector(
	[walletState],
	(wallet): EFeeId => {
		const selectedWallet = wallet.selectedWallet;
		const selectedNetwork = wallet.selectedNetwork;
		return (
			wallet.wallets[selectedWallet]?.transaction[selectedNetwork]
				?.selectedFeeId ?? EFeeId.none
		);
	},
);
