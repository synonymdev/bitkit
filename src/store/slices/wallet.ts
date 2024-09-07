import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
	IAddress,
	IAddresses,
	IFormattedTransactions,
	IHeader,
	IWalletData,
} from 'beignet';

import {
	defaultWalletStoreShape,
	getDefaultWalletShape,
	IAddressTypeContent,
} from '../shapes/wallet';
import {
	ETransferType,
	ETransferStatus,
	IWallets,
	IWalletStore,
	TTransfer,
} from '../types/wallet';
import { EAvailableNetwork } from '../../utils/networks';

type TWalletDataKey = Exclude<
	keyof IWalletData,
	'header' | 'feeEstimates' | 'selectedFeeId'
>;
type TWalletDataValues = IWalletData[TWalletDataKey];

export const walletSlice = createSlice({
	name: 'wallet',
	initialState: defaultWalletStoreShape,
	reducers: {
		createWallet: (state, action: PayloadAction<IWallets>) => {
			state.wallets = {
				...state.wallets,
				...action.payload,
			};
		},
		updateWallet: (state, action: PayloadAction<Partial<IWalletStore>>) => {
			state = Object.assign(state, action.payload);
		},
		updateWalletData: (
			state,
			action: PayloadAction<{
				selectedWallet: string;
				network: EAvailableNetwork;
				key: TWalletDataKey;
				data: TWalletDataValues;
			}>,
		) => {
			const { selectedNetwork } = state;
			const { selectedWallet, key, data } = action.payload;
			const network = action.payload.network ?? selectedNetwork;

			switch (key) {
				case 'id': {
					state.wallets[selectedWallet][key] = data;
					return;
				}
				case 'balance':
				case 'utxos':
				case 'blacklistedUtxos':
				case 'unconfirmedTransactions':
				case 'addressType': {
					state.wallets[selectedWallet][key][network] = data;
					return;
				}
				default: {
					const objectData = data as IWalletData[typeof key];
					state.wallets[selectedWallet][key][network] = {
						...state.wallets[selectedWallet][key][network],
						...objectData,
					};
					return;
				}
			}
		},
		updateHeader: (
			state,
			action: PayloadAction<{
				header: IHeader;
				selectedNetwork: EAvailableNetwork;
			}>,
		) => {
			const { header, selectedNetwork } = action.payload;
			state.header[selectedNetwork] = header;
		},
		addTransfer: (state, action: PayloadAction<TTransfer>) => {
			const { selectedWallet, selectedNetwork } = state;
			const transfer = action.payload;
			state.wallets[selectedWallet].transfers[selectedNetwork].push(transfer);
		},
		updateTransfer: (
			state,
			action: PayloadAction<{
				txId: string;
				amount?: number;
				confirmsIn?: number;
			}>,
		) => {
			const { selectedWallet, selectedNetwork } = state;
			const transfers =
				state.wallets[selectedWallet].transfers[selectedNetwork];
			const { txId, amount, confirmsIn } = action.payload;
			const updated = transfers.map((transfer) => {
				if (transfer.txId === txId) {
					const updatedTransfer = {
						...transfer,
						status: ETransferStatus.done,
						// don't overwrite amount if it's already set
						amount: amount || transfer.amount,
					};
					if (transfer.type !== ETransferType.open) {
						// for channel closes, also update confirmsIn
						// eslint-disable-next-line dot-notation
						updatedTransfer['confirmsIn'] = confirmsIn;
					}
					if (transfer.type === ETransferType.forceClose) {
						// for force closes, set status to pending if confirmsIn is not 0
						updatedTransfer.status =
							confirmsIn !== 0 ? ETransferStatus.pending : ETransferStatus.done;
					}
					return updatedTransfer;
				} else {
					return transfer;
				}
			});

			state.wallets[selectedWallet].transfers[selectedNetwork] = updated;
		},
		removeTransfer: (state, action: PayloadAction<string>) => {
			const { selectedWallet, selectedNetwork } = state;
			const current = state.wallets[selectedWallet].transfers[selectedNetwork];
			const updated = current.filter((transfer) => {
				return transfer.txId !== action.payload;
			});
			state.wallets[selectedWallet].transfers[selectedNetwork] = updated;
		},
		updateTransactions: (
			state,
			action: PayloadAction<IFormattedTransactions>,
		) => {
			const { selectedWallet, selectedNetwork } = state;
			state.wallets[selectedWallet].transactions[selectedNetwork] = {
				...state.wallets[selectedWallet].transactions[selectedNetwork],
				...action.payload,
			};
		},
		addUnconfirmedTransactions: (
			state,
			action: PayloadAction<IFormattedTransactions>,
		) => {
			const { selectedWallet, selectedNetwork } = state;
			state.wallets[selectedWallet].unconfirmedTransactions[selectedNetwork] = {
				...state.wallets[selectedWallet].unconfirmedTransactions[
					selectedNetwork
				],
				...action.payload,
			};
		},
		replaceImpactedAddresses: (
			state,
			action: PayloadAction<{
				newAddresses: IAddressTypeContent<IAddresses>;
				newAddressIndex: IAddressTypeContent<IAddress>;
				newChangeAddresses: IAddressTypeContent<IAddresses>;
				newChangeAddressIndex: IAddressTypeContent<IAddress>;
			}>,
		) => {
			const { selectedWallet, selectedNetwork } = state;
			state.wallets[selectedWallet].addresses[selectedNetwork] =
				action.payload.newAddresses;
			state.wallets[selectedWallet].addressIndex[selectedNetwork] =
				action.payload.newAddressIndex;
			state.wallets[selectedWallet].changeAddresses[selectedNetwork] =
				action.payload.newChangeAddresses;
			state.wallets[selectedWallet].changeAddressIndex[selectedNetwork] =
				action.payload.newChangeAddressIndex;
		},
		resetSelectedWallet: (state) => {
			const { selectedWallet } = state;
			state.wallets[selectedWallet] = getDefaultWalletShape();
		},
		resetExchangeRates: (state) => {
			state.exchangeRates = defaultWalletStoreShape.exchangeRates;
		},
		setWalletExits: (state) => {
			state.walletExists = true;
		},
	},
});

const { actions, reducer } = walletSlice;

export const {
	createWallet,
	updateWallet,
	updateWalletData,
	updateHeader,
	addTransfer,
	updateTransfer,
	removeTransfer,
	updateTransactions,
	addUnconfirmedTransactions,
	replaceImpactedAddresses,
	resetSelectedWallet,
	resetExchangeRates,
	setWalletExits,
} = actions;

export default reducer;
