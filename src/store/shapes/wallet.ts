import { WALLET_DEFAULT_SELECTED_NETWORK } from '@env';

import {
	IWalletItem,
	IWallet,
	IWalletStore,
	IBitcoinTransactionData,
	defaultBitcoinTransactionData,
	IKeyDerivationPath,
	IAddressTypes,
	TAssetNetwork,
	IAddresses,
	IAddress,
	EAddressType,
} from '../types/wallet';
import { IHeader } from '../../utils/types/electrum';
import { EAvailableNetworks } from '../../utils/networks';
import { objectKeys } from '../../utils/objectKeys';
import cloneDeep from 'lodash.clonedeep';

export const assetNetworks: Readonly<TAssetNetwork[]> = [
	'bitcoin',
	'lightning',
];

export const addressTypes: Readonly<IAddressTypes> = {
	[EAddressType.p2pkh]: {
		path: "m/44'/0'/0'/0/0",
		type: EAddressType.p2pkh,
		label: 'legacy',
	},
	[EAddressType.p2sh]: {
		path: "m/49'/0'/0'/0/0",
		type: EAddressType.p2sh,
		label: 'segwit',
	},
	[EAddressType.p2wpkh]: {
		path: "m/84'/0'/0'/0/0",
		type: EAddressType.p2wpkh,
		label: 'bech32',
	},
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

export const header: Readonly<IHeader> = {
	height: 0,
	hash: '',
	hex: '',
};

export const defaultWalletShape: Readonly<IWallet> = {
	id: 'wallet0',
	name: '',
	type: 'default',
	addresses: getAddressesShape(),
	addressIndex: getAddressIndexShape(),
	lastUsedAddressIndex: getAddressIndexShape(),
	changeAddresses: getAddressesShape(),
	changeAddressIndex: getAddressIndexShape(),
	lastUsedChangeAddressIndex: getAddressIndexShape(),
	utxos: arrayTypeItems,
	boostedTransactions: objectTypeItems,
	transactions: objectTypeItems,
	blacklistedUtxos: arrayTypeItems,
	balance: numberTypeItems,
	lastUpdated: numberTypeItems,
	hasBackedUpWallet: false,
	walletBackupTimestamp: '',
	keyDerivationPath: {
		bitcoin: defaultKeyDerivationPath,
		bitcoinTestnet: {
			...defaultKeyDerivationPath,
			coinType: '0',
		},
		bitcoinRegtest: defaultKeyDerivationPath,
	},
	networkTypePath: {
		bitcoin: '0',
		bitcoinTestnet: '1',
		bitcoinRegtest: '0',
	},
	addressType: {
		bitcoin: EAddressType.p2wpkh,
		bitcoinTestnet: EAddressType.p2wpkh,
		bitcoinRegtest: EAddressType.p2wpkh,
	},
	rbfData: objectTypeItems,
	transaction: bitcoinTransaction,
};

export const defaultWalletStoreShape: Readonly<IWalletStore> = {
	walletExists: false,
	selectedNetwork: WALLET_DEFAULT_SELECTED_NETWORK,
	selectedWallet: 'wallet0',
	addressTypes: addressTypes,
	exchangeRates: {},
	header: {
		bitcoin: header,
		bitcoinTestnet: header,
		bitcoinRegtest: header,
	},
	wallets: {},
};

export const getDefaultWalletShape = (): IWallet => {
	return cloneDeep(defaultWalletShape);
};
