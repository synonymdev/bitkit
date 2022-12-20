import {
	IWalletItem,
	IDefaultWalletShape,
	IWallet,
	IBitcoinTransactionData,
	defaultBitcoinTransactionData,
	IKeyDerivationPath,
	IAddressTypes,
	TAssetNetwork,
	IAddress,
	IAddressContent,
	EAddressType,
} from '../types/wallet';
import { IHeader } from '../../utils/types/electrum';

export const assetNetworks: TAssetNetwork[] = ['bitcoin', 'lightning'];

export const addressTypes: IAddressTypes = {
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

export const bitcoinTransaction: IWalletItem<IBitcoinTransactionData> = {
	bitcoin: defaultBitcoinTransactionData,
	bitcoinTestnet: defaultBitcoinTransactionData,
	bitcoinRegtest: defaultBitcoinTransactionData,
};

export const numberTypeItems: IWalletItem<number> = {
	bitcoin: 0,
	bitcoinTestnet: 0,
	bitcoinRegtest: 0,
	timestamp: null,
};

export const arrayTypeItems: IWalletItem<[]> = {
	bitcoin: [],
	bitcoinTestnet: [],
	bitcoinRegtest: [],
	timestamp: null,
};

export const objectTypeItems: IWalletItem<object> = {
	bitcoin: {},
	bitcoinTestnet: {},
	bitcoinRegtest: {},
	timestamp: null,
};

export const stringTypeItems: IWalletItem<string> = {
	bitcoin: '',
	bitcoinTestnet: '',
	bitcoinRegtest: '',
	timestamp: null,
};

export const addressContent: IAddressContent = {
	index: -1,
	path: '',
	address: '',
	scriptHash: '',
	publicKey: '',
};

export const getAddressTypeContent = (
	data: IAddressContent | IAddress,
): IAddressTypeContent<IAddressContent> => {
	let content = {};
	Object.keys(addressTypes).map((addressType) => {
		content[addressType] = data;
	});
	return content;
};

export type IAddressTypeContent<T> = {
	[key: string]: T;
};

export type TAddressIndexInfo = {
	addressIndex: IAddressContent;
	changeAddressIndex: IAddressContent;
	lastUsedAddressIndex: IAddressContent;
	lastUsedChangeAddressIndex: IAddressContent;
};

export const getAddressIndexShape = (): IWalletItem<IAddress> => {
	return {
		bitcoin: getAddressTypeContent(addressContent),
		bitcoinTestnet: getAddressTypeContent(addressContent),
		bitcoinRegtest: getAddressTypeContent(addressContent),
		timestamp: null,
	};
};

export const getAddressesShape = (): IWalletItem<
	IAddressTypeContent<IAddressContent>
> => {
	return {
		bitcoin: getAddressTypeContent({}),
		bitcoinTestnet: getAddressTypeContent({}),
		bitcoinRegtest: getAddressTypeContent({}),
		timestamp: null,
	};
};

export const defaultKeyDerivationPath: IKeyDerivationPath = {
	purpose: '84',
	coinType: '0',
	account: '0',
	change: '0',
	addressIndex: '0',
};

export const header: IHeader = {
	height: 0,
	hash: '',
	hex: '',
};

export const defaultWalletShape: IDefaultWalletShape = {
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

export const defaultWalletStoreShape: IWallet = {
	walletExists: false,
	selectedNetwork: 'bitcoin',
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
