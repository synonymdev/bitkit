import cloneDeep from 'lodash/cloneDeep';
import { __WALLET_DEFAULT_SELECTED_NETWORK__ } from '../../constants/env';
import { IHeader } from '../../utils/types/electrum';
import { EAvailableNetwork } from '../../utils/networks';
import { objectKeys } from '../../utils/objectKeys';
import { IWallet, IWalletItem, IWalletStore } from '../types/wallet';
import {
	EAddressType,
	EBoostType,
	EFeeId,
	IAddress,
	IAddresses,
	ISendTransaction,
	TAddressTypes,
	TGapLimitOptions,
} from 'beignet';

export const addressTypes: Readonly<TAddressTypes> = {
	[EAddressType.p2tr]: {
		type: EAddressType.p2tr,
		path: "m/86'/0'/0'/0/0",
		name: 'Taproot',
		shortName: 'Taproot',
		description: 'Taproot Address',
		example: '(bc1px...)',
	},
	[EAddressType.p2wpkh]: {
		type: EAddressType.p2wpkh,
		path: "m/84'/0'/0'/0/0",
		name: 'Native Segwit Bech32',
		shortName: 'Native Segwit',
		description: 'Pay-to-witness-public-key-hash',
		example: '(bc1x...)',
	},
	[EAddressType.p2sh]: {
		type: EAddressType.p2sh,
		path: "m/49'/0'/0'/0/0",
		name: 'Nested Segwit',
		shortName: 'Segwit',
		description: 'Pay-to-Script-Hash',
		example: '(3x...)',
	},
	[EAddressType.p2pkh]: {
		type: EAddressType.p2pkh,
		path: "m/44'/0'/0'/0/0",
		name: 'Legacy',
		shortName: 'Legacy',
		description: 'Pay-to-public-key-hash',
		example: '(1x...)',
	},
};

export const getNetworkContent = <T>(data: T): Readonly<IWalletItem<T>> => {
	const networks = objectKeys(EAvailableNetwork);
	const content = {} as IWalletItem<T>;

	networks.forEach((network) => {
		content[network] = data;
	});

	return cloneDeep(content);
};

export const getAddressTypeContent = <T>(
	data: T,
): Readonly<IAddressTypeContent<T>> => {
	const addressTypeKeys = objectKeys(EAddressType);
	const content = {} as IAddressTypeContent<T>;

	addressTypeKeys.forEach((addressType) => {
		content[addressType] = data;
	});

	return cloneDeep(content);
};

export type IAddressTypeContent<T> = {
	[key in EAddressType]: T;
};

export const getAddressIndexShape = (): IWalletItem<
	IAddressTypeContent<IAddress>
> => {
	return cloneDeep({
		[EAvailableNetwork.bitcoin]: getAddressTypeContent<IAddress>(
			defaultAddressContent,
		),
		[EAvailableNetwork.bitcoinTestnet]: getAddressTypeContent<IAddress>(
			defaultAddressContent,
		),
		[EAvailableNetwork.bitcoinRegtest]: getAddressTypeContent<IAddress>(
			defaultAddressContent,
		),
		timestamp: null,
	});
};

export const getAddressesShape = (): IWalletItem<
	IAddressTypeContent<IAddresses>
> => {
	return cloneDeep({
		[EAvailableNetwork.bitcoin]: getAddressTypeContent<IAddresses>({}),
		[EAvailableNetwork.bitcoinTestnet]: getAddressTypeContent<IAddresses>({}),
		[EAvailableNetwork.bitcoinRegtest]: getAddressTypeContent<IAddresses>({}),
		timestamp: null,
	});
};

export const defaultSendTransaction: ISendTransaction = {
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

export const defaultAddressContent: Readonly<IAddress> = {
	index: -1,
	path: '',
	address: '',
	scriptHash: '',
	publicKey: '',
};

export const defaultHeader: Readonly<IHeader> = {
	height: 0,
	hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
	hex: '0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c',
};

export const defaultWalletShape: Readonly<IWallet> = {
	id: '',
	name: 'wallet0',
	seedHash: '',
	addresses: getAddressesShape(),
	addressIndex: getAddressIndexShape(),
	lastUsedAddressIndex: getAddressIndexShape(),
	changeAddresses: getAddressesShape(),
	changeAddressIndex: getAddressIndexShape(),
	lastUsedChangeAddressIndex: getAddressIndexShape(),
	utxos: getNetworkContent([]),
	blacklistedUtxos: getNetworkContent([]),
	boostedTransactions: getNetworkContent({}),
	unconfirmedTransactions: getNetworkContent({}),
	transfers: getNetworkContent([]),
	transactions: getNetworkContent({}),
	transaction: getNetworkContent(defaultSendTransaction),
	balance: getNetworkContent(0),
	addressType: {
		bitcoin: EAddressType.p2wpkh,
		bitcoinTestnet: EAddressType.p2wpkh,
		bitcoinRegtest: EAddressType.p2wpkh,
	},
};

const defaultGapLimitOptions: TGapLimitOptions = {
	lookAhead: 10,
	lookBehind: 10,
	lookAheadChange: 5,
	lookBehindChange: 5,
};

export const getDefaultGapLimitOptions = (): TGapLimitOptions => {
	return cloneDeep(defaultGapLimitOptions);
};

export const defaultWalletStoreShape: Readonly<IWalletStore> = {
	walletExists: false,
	selectedNetwork: __WALLET_DEFAULT_SELECTED_NETWORK__,
	selectedWallet: 'wallet0',
	exchangeRates: {},
	addressTypesToMonitor: [EAddressType.p2wpkh],
	gapLimitOptions: getDefaultGapLimitOptions(),
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

export const getDefaultWalletStoreShape = (): IWalletStore => {
	return cloneDeep(defaultWalletStoreShape);
};
