import { produce } from 'immer';

import actions from '../actions/actions';
import { ETransferStatus, ETransferType, IWalletStore } from '../types/wallet';
import {
	getDefaultWalletShape,
	defaultWalletStoreShape,
	defaultSendTransaction,
} from '../shapes/wallet';

const wallet = (
	state: IWalletStore = defaultWalletStoreShape,
	action,
): IWalletStore => {
	let { selectedWallet, selectedNetwork } = state;

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

		case actions.UPDATE_WALLET_DATA:
			const { value, data } = action.payload;
			const network = action.payload?.network ?? selectedNetwork;

			// Values that are not nested and do not have a network
			if (value === 'name' || value === 'id' || value === 'seedHash') {
				return {
					...state,
					wallets: {
						...state.wallets,
						[selectedWallet]: {
							...state.wallets[selectedWallet],
							[value]: data,
						},
					},
				};
			}

			if (
				value === 'balance' ||
				value === 'utxos' ||
				value === 'blacklistedUtxos' ||
				value === 'unconfirmedTransactions' ||
				value === 'addressType'
			) {
				return {
					...state,
					wallets: {
						...state.wallets,
						[selectedWallet]: {
							...state.wallets[selectedWallet],
							[value]: {
								...state.wallets[selectedWallet][value],
								[network]: data,
							},
						},
					},
				};
			}

			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						[value]: {
							...state.wallets[selectedWallet][value],
							[network]: {
								...state.wallets[selectedWallet][value][network],
								...data,
							},
						},
					},
				},
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
								[addressType]: action.payload.addressIndex,
							},
						},
						changeAddressIndex: {
							...state.wallets[selectedWallet].changeAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].changeAddressIndex[
									selectedNetwork
								],
								[addressType]: action.payload.changeAddressIndex,
							},
						},
						lastUsedAddressIndex: {
							...state.wallets[selectedWallet].lastUsedAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].lastUsedAddressIndex[
									selectedNetwork
								],
								[addressType]: action.payload.lastUsedAddressIndex,
							},
						},
						lastUsedChangeAddressIndex: {
							...state.wallets[selectedWallet].lastUsedChangeAddressIndex,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].lastUsedChangeAddressIndex[
									selectedNetwork
								],
								[addressType]: action.payload.lastUsedChangeAddressIndex,
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

		case actions.ADD_TRANSFER: {
			return produce(state, (draftState) => {
				draftState.wallets[selectedWallet].transfers[selectedNetwork].push(
					action.payload,
				);
			});
		}

		case actions.UPDATE_TRANSFER: {
			return produce(state, (draftState) => {
				const current =
					state.wallets[selectedWallet].transfers[selectedNetwork];
				const { txId, confirmations } = action.payload;
				const updated = current.map((transfer) => {
					if (transfer.txId === txId) {
						let status = ETransferStatus.done;
						if (transfer.type !== ETransferType.open) {
							status =
								confirmations < 6
									? ETransferStatus.pending
									: ETransferStatus.done;
						}
						return {
							...transfer,
							status,
							confirmations,
						};
					} else {
						return transfer;
					}
				});

				draftState.wallets[selectedWallet].transfers[selectedNetwork] = updated;
			});
		}

		case actions.REMOVE_TRANSFER: {
			return produce(state, (draftState) => {
				const current =
					state.wallets[selectedWallet].transfers[selectedNetwork];
				const updated = current.filter((transfer) => {
					return transfer.txId !== action.payload;
				});
				draftState.wallets[selectedWallet].transfers[selectedNetwork] = updated;
			});
		}

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

		case actions.RESET_TRANSACTIONS:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transactions: {
							...state.wallets[selectedWallet].transactions,
							[selectedNetwork]: {},
						},
						unconfirmedTransactions: {
							...state.wallets[selectedWallet].transactions,
							[selectedNetwork]: {},
						},
					},
				},
			};

		case actions.RESET_ADDRESSES:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						addresses: {
							...state.wallets[selectedWallet].addresses,
							[selectedNetwork]: {},
						},
						changeAddresses: {
							...state.wallets[selectedWallet].changeAddresses,
							[selectedNetwork]: {},
						},
					},
				},
			};

		case actions.ADD_UNCONFIRMED_TRANSACTIONS:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						unconfirmedTransactions: {
							...state.wallets[selectedWallet].unconfirmedTransactions,
							[selectedNetwork]: {
								...state.wallets[selectedWallet].unconfirmedTransactions[
									selectedNetwork
								],
								...(action.payload?.unconfirmedTransactions ?? {}),
							},
						},
					},
				},
			};

		case actions.UPDATE_UNCONFIRMED_TRANSACTIONS:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						unconfirmedTransactions: {
							...state.wallets[selectedWallet].unconfirmedTransactions,
							[selectedNetwork]: action.payload?.unconfirmedTransactions ?? {},
						},
					},
				},
			};

		case actions.RESET_SELECTED_WALLET:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: getDefaultWalletShape(),
				},
			};

		case actions.RESET_EXCHANGE_RATES:
			return {
				...state,
				exchangeRates: defaultWalletStoreShape.exchangeRates,
			};

		case actions.UPDATE_SEND_TRANSACTION:
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
								max: defaultSendTransaction.max,
							},
						},
					},
				},
			};

		case actions.RESET_SEND_TRANSACTION:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						transaction: {
							...state.wallets[selectedWallet].transaction,
							[selectedNetwork]: defaultSendTransaction,
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

		case actions.REPLACE_IMPACTED_ADDRESSES:
			return {
				...state,
				wallets: {
					...state.wallets,
					[selectedWallet]: {
						...state.wallets[selectedWallet],
						addresses: {
							...state.wallets[selectedWallet].addresses,
							[selectedNetwork]: action.payload.newAddresses,
						},
						addressIndex: {
							...state.wallets[selectedWallet].addressIndex,
							[selectedNetwork]: action.payload.newAddressIndex,
						},
						changeAddresses: {
							...state.wallets[selectedWallet].changeAddresses,
							[selectedNetwork]: action.payload.newChangeAddresses,
						},
						changeAddressIndex: {
							...state.wallets[selectedWallet].changeAddressIndex,
							[selectedNetwork]: action.payload.newChangeAddressIndex,
						},
					},
				},
			};

		case actions.RESET_WALLET_STORE:
			return defaultWalletStoreShape;

		default:
			return state;
	}
};

export default wallet;
