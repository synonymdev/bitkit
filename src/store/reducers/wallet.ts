import { produce } from 'immer';

import actions from '../actions/actions';
import {
	defaultBitcoinTransactionData,
	EOutput,
	IWalletStore,
} from '../types/wallet';
import { defaultWalletStoreShape } from '../shapes/wallet';

const wallet = (
	state: IWalletStore = defaultWalletStoreShape,
	action,
): IWalletStore => {
	let selectedWallet = state.selectedWallet;
	let selectedNetwork = state.selectedNetwork;
	if (action.payload?.selectedWallet) {
		selectedWallet = action.payload.selectedWallet;
	}
	if (action.payload?.selectedNetwork) {
		selectedNetwork = action.payload.selectedNetwork;
	}
	let addressType = state.wallets[selectedWallet]?.addressType[selectedNetwork];
	if (action.payload?.addressType) {
		addressType = action.payload.addressType;
	}

	switch (action.type) {
		case actions.UPDATE_WALLET:
			return {
				...state,
				...action.payload,
			};

		case actions.CREATE_WALLET:
			return produce(state, (draftState) => {
				draftState.walletExists = true;
				draftState.wallets = {
					...state.wallets,
					...action.payload,
				};
			});

		case actions.UPDATE_ADDRESS_INDEX:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						addressIndex: {
							...state.wallets[selectedWallet].addressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].addressIndex[selectedNetwork],
								[addressType]:
									action.payload?.addressIndex ??
									state.wallets[selectedWallet].addressIndex[selectedNetwork][
										addressType
									],
							},
						},
						changeAddressIndex: {
							...state.wallets[selectedWallet].changeAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].changeAddressIndex[
									selectedNetwork
								],
								[addressType]:
									action.payload?.changeAddressIndex ??
									state.wallets[selectedWallet].changeAddressIndex[
										selectedNetwork
									][addressType],
							},
						},
						lastUsedAddressIndex: {
							...state.wallets[selectedWallet].lastUsedAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].lastUsedAddressIndex[
									selectedNetwork
								],
								[addressType]:
									action.payload?.lastUsedAddressIndex ??
									state.wallets[selectedWallet].lastUsedAddressIndex[
										selectedNetwork
									][addressType],
							},
						},
						lastUsedChangeAddressIndex: {
							...state.wallets[selectedWallet].lastUsedChangeAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].lastUsedChangeAddressIndex[
									selectedNetwork
								],
								[addressType]:
									action.payload?.lastUsedChangeAddressIndex ??
									state.wallets[selectedWallet].lastUsedChangeAddressIndex[
										selectedNetwork
									][addressType],
							},
						},
					},
				},
			};

		case actions.UPDATE_WALLET_BALANCE:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						balance: {
							...state.wallets[selectedWallet].balance,
							[selectedNetwork]: action.payload.balance,
						},
					},
				},
			};

		case actions.ADD_ADDRESSES:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						addresses: {
							...state.wallets[selectedWallet].addresses,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].addresses[selectedNetwork],
								[addressType]: {
									...state.wallets[selectedWallet].addresses[selectedNetwork][
										addressType
									],
									...action.payload.addresses,
								},
							},
						},
						changeAddresses: {
							...state.wallets[selectedWallet].changeAddresses,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].changeAddresses[
									selectedNetwork
								],
								[addressType]: {
									...state.wallets[selectedWallet].changeAddresses[
										selectedNetwork
									][addressType],
									...action.payload.changeAddresses,
								},
							},
						},
					},
				},
			};

		case actions.UPDATE_UTXOS:
			const { utxos, balance } = action.payload;
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						balance: {
							...state.wallets[selectedWallet].balance,
							[selectedNetwork]: balance,
						},
						utxos: {
							...state.wallets[selectedWallet].utxos,
							[selectedNetwork]: utxos,
						},
					},
				},
			};

		case actions.UPDATE_TRANSACTIONS:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transactions: {
							...state.wallets[selectedWallet].transactions,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].transactions[selectedNetwork],
								...(action.payload?.transactions ?? {}),
							},
						},
					},
				},
			};

		case actions.RESET_SELECTED_WALLET:
			const wallets = state.wallets;
			delete wallets[selectedWallet];
			return {
				...state,
				wallets: {
					...wallets,
				},
			};

		case actions.RESET_EXCHANGE_RATES:
			return {
				...state,
				exchangeRates: defaultWalletStoreShape.exchangeRates,
			};

		case actions.UPDATE_ON_CHAIN_TRANSACTION:
			const transaction = action.payload.transaction;
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transaction: {
							...state.wallets[selectedWallet].transaction,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].transaction[selectedNetwork],
								...transaction,
							},
						},
					},
				},
			};

		case actions.SETUP_ON_CHAIN_TRANSACTION:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transaction: {
							...state.wallets[selectedWallet].transaction,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].transaction[selectedNetwork],
								changeAddress: action.payload.changeAddress,
								inputs: action.payload.inputs,
								outputs: action.payload.outputs,
								fee: action.payload.fee,
								rbf: action.payload.rbf,
								max: defaultBitcoinTransactionData.max,
							},
						},
					},
				},
			};

		case actions.RESET_OUTPUTS:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transaction: {
							...state.wallets[selectedWallet].transaction,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].transaction[selectedNetwork],
								outputs: [EOutput],
							},
						},
					},
				},
			};

		case actions.RESET_ON_CHAIN_TRANSACTION:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transaction: {
							...state.wallets[selectedWallet].transaction,
							[selectedNetwork]: defaultBitcoinTransactionData,
						},
					},
				},
			};

		case actions.UPDATE_SELECTED_ADDRESS_TYPE:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						addressType: {
							...state.wallets[selectedWallet].addressType,
							[selectedNetwork]: action.payload.addressType,
						},
					},
				},
			};

		case actions.DELETE_ON_CHAIN_TRANSACTION:
			const transactions =
				state.wallets[selectedWallet].transactions[selectedNetwork];
			if (action.payload.txid in transactions) {
				delete transactions[action.payload.txid];
			}
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transactions: {
							...state.wallets[selectedWallet].transactions,
							[selectedNetwork]: transactions,
						},
					},
				},
			};

		case actions.ADD_BOOSTED_TRANSACTION:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						boostedTransactions: {
							...state.wallets[selectedWallet].boostedTransactions,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].boostedTransactions[
									selectedNetwork
								],
								...action.payload.boostedTransaction,
							},
						},
					},
				},
			};

		case actions.UPDATE_HEADER:
			return {
				...state,
				header: {
					...state.header,
					[selectedNetwork]: action.payload.header,
				},
			};

		case actions.RESET_WALLET_STORE:
			return defaultWalletStoreShape;

		default:
			return state;
	}
};

export default wallet;
