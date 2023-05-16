import cloneDeep from 'lodash.clonedeep';

import { __WALLET_DEFAULT_SELECTED_NETWORK__ } from '../../constants/env';
import { IHeader } from '../../utils/types/electrum';
import { EAvailableNetworks } from '../../utils/networks';
import { objectKeys } from '../../utils/objectKeys';
import { EFeeId } from '../types/fees';
import {
	IWalletItem,
	IWallet,
	IWalletStore,
	IBitcoinTransactionData,
	IKeyDerivationPath,
	IAddressTypes,
	IAddresses,
	IAddress,
	EAddressType,
	EBoostType,
} from '../types/wallet';

export const addressTypes: Readonly<IAddressTypes> = {
	[EAddressType.p2wpkh]: {
		name: 'Native Segwit Bech32',
		type: EAddressType.p2wpkh,
		path: "m/84'/0'/0'/0/0",
		description: 'Pay-to-witness-public-key-hash',
		example: '(bc1x...)',
	},
	[EAddressType.p2sh]: {
		name: 'Nested Segwit',
		type: EAddressType.p2sh,
		path: "m/49'/0'/0'/0/0",
		description: 'Pay-to-Script-Hash',
		example: '(3x...)',
	},
	[EAddressType.p2pkh]: {
		name: 'Legacy',
		type: EAddressType.p2pkh,
		path: "m/44'/0'/0'/0/0",
		description: 'Pay-to-public-key-hash',
		example: '(1x...)',
	},
};

export const defaultBitcoinTransactionData: IBitcoinTransactionData = {
	outputs: [],
	inputs: [],
	changeAddress: '',
	fiatAmount: 0,
	fee: 512,
	satsPerByte: 2,
	selectedFeeId: EFeeId.none,
	message: '',
	label: '',
	rbf: false,
	boostType: EBoostType.cpfp,
	minFee: 1,
	max: false,
	tags: [],
	lightningInvoice: '',
};

export const bitcoinTransaction: Readonly<
	IWalletItem<IBitcoinTransactionData>
> = {
	bitcoin: defaultBitcoinTransactionData,
	bitcoinTestnet: defaultBitcoinTransactionData,
	bitcoinRegtest: defaultBitcoinTransactionData,
};

export const numberTypeItems: Readonly<IWalletItem<number>> = {
	bitcoin: 0,
	bitcoinTestnet: 0,
	bitcoinRegtest: 0,
	timestamp: null,
};

export const arrayTypeItems: Readonly<IWalletItem<[]>> = {
	bitcoin: [],
	bitcoinTestnet: [],
	bitcoinRegtest: [],
	timestamp: null,
};

export const objectTypeItems: Readonly<IWalletItem<{}>> = {
	bitcoin: {},
	bitcoinTestnet: {},
	bitcoinRegtest: {},
	timestamp: null,
};

export const stringTypeItems: Readonly<IWalletItem<string>> = {
	bitcoin: '',
	bitcoinTestnet: '',
	bitcoinRegtest: '',
	timestamp: null,
};

export const addressContent: Readonly<IAddress> = {
	index: -1,
	path: '',
	address: '',
	scriptHash: '',
	publicKey: '',
};

export const getAddressTypeContent = <T>(data: T): IAddressTypeContent<T> => {
	const addressTypeKeys = objectKeys(addressTypes);
	const content = {} as IAddressTypeContent<T>;

	addressTypeKeys.forEach((addressType) => {
		content[addressType] = data;
	});

	return cloneDeep(content);
};

export type IAddressTypeContent<T> = {
	[key in EAddressType]: T;
};

export type TAddressIndexInfo = {
	addressIndex: IAddress;
	changeAddressIndex: IAddress;
	lastUsedAddressIndex: IAddress;
	lastUsedChangeAddressIndex: IAddress;
};

export const getAddressIndexShape = (): IWalletItem<
	IAddressTypeContent<IAddress>
> => {
	return cloneDeep({
		[EAvailableNetworks.bitcoin]:
			getAddressTypeContent<IAddress>(addressContent),
		[EAvailableNetworks.bitcoinTestnet]:
			getAddressTypeContent<IAddress>(addressContent),
		[EAvailableNetworks.bitcoinRegtest]:
			getAddressTypeContent<IAddress>(addressContent),
		timestamp: null,
	});
};

export const getAddressesShape = (): IWalletItem<
	IAddressTypeContent<IAddresses>
> => {
	return cloneDeep({
		[EAvailableNetworks.bitcoin]: getAddressTypeContent<IAddresses>({}),
		[EAvailableNetworks.bitcoinTestnet]: getAddressTypeContent<IAddresses>({}),
		[EAvailableNetworks.bitcoinRegtest]: getAddressTypeContent<IAddresses>({}),
		timestamp: null,
	});
};

export const defaultKeyDerivationPath: Readonly<IKeyDerivationPath> = {
	purpose: '84',
	coinType: '0',
	account: '0',
	change: '0',
	addressIndex: '0',
};

export const defaultHeader: Readonly<IHeader> = {
	height: 0,
	hash: '',
	hex: '',
};

export const defaultWalletShape: Readonly<IWallet> = {
	id: 'wallet0',
	name: '',
	addresses: getAddressesShape(),
	addressIndex: getAddressIndexShape(),
	lastUsedAddressIndex: getAddressIndexShape(),
	changeAddresses: getAddressesShape(),
	changeAddressIndex: getAddressIndexShape(),
	lastUsedChangeAddressIndex: getAddressIndexShape(),
	utxos: arrayTypeItems,
	blacklistedUtxos: arrayTypeItems,
	boostedTransactions: objectTypeItems,
	transactions: objectTypeItems,
	transaction: bitcoinTransaction,
	balance: numberTypeItems,
	addressType: {
		bitcoin: EAddressType.p2wpkh,
		bitcoinTestnet: EAddressType.p2wpkh,
		bitcoinRegtest: EAddressType.p2wpkh,
	},
};

export const defaultWalletStoreShape: Readonly<IWalletStore> = {
	walletExists: false,
	selectedNetwork: __WALLET_DEFAULT_SELECTED_NETWORK__,
	selectedWallet: 'wallet0',
	exchangeRates: {},
	header: {
		bitcoin: defaultHeader,
		bitcoinTestnet: defaultHeader,
		bitcoinRegtest: defaultHeader,
	},
	wallets: {},
};

export const getDefaultWalletShape = (): IWallet => {
	return cloneDeep(defaultWalletShape);
};
