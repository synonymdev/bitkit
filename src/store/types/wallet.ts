import { TAvailableNetworks } from '../../utils/networks';
import { IExchangeRates } from '../../utils/exchange-rate/types';
import { IAddressTypeContent } from '../shapes/wallet';
import { EFeeIds } from './fees';
import { IHeader } from '../../utils/types/electrum';

export type TAddressType = 'p2wpkh' | 'p2sh' | 'p2pkh' | string;
export type TAddressFormat = 'p2wpkh' | 'p2sh' | 'p2pkh'; //"84" | "49" | "44";
export type TKeyDerivationAccountType = 'onchain';
export type TKeyDerivationPurpose = '84' | '49' | '44' | string; //"p2wpkh" | "p2sh" | "p2pkh";
export type TKeyDerivationCoinType = '0' | '1' | string; //"mainnet" | "testnet";
export type TKeyDerivationAccount = '0' | string; //"On-Chain Wallet";
export type TKeyDerivationChange = '0' | '1' | string; //"Receiving Address" | "Change Address";
export type TKeyDerivationAddressIndex = string;
export type TAssetType = 'bitcoin' | 'tether';
export type TAssetNetwork = 'bitcoin' | 'lightning';

export type NetworkTypePath = '0' | '1'; //"mainnet" | "testnet"

export type TBitcoinUnit = 'satoshi' | 'BTC' | 'mBTC' | 'μBTC';

export type TBalanceUnit = 'satoshi' | 'BTC' | 'fiat';

export type TBitcoinAbbreviation = 'sats' | 'BTC';

export type TBitcoinLabel = 'Bitcoin' | 'Bitcoin Testnet' | 'Bitcoin Regtest';

export type TTicker = 'BTC' | 'tBTC';

export type TTransactionType = 'sent' | 'received';

export type TGetByteCountInput =
	| 'MULTISIG-P2SH'
	| 'MULTISIG-P2WSH'
	| 'MULTISIG-P2SH-P2WSH'
	| 'P2PKH'
	| 'P2WPKH'
	| 'P2SH-P2WPKH'
	| 'p2wpkh'
	| 'p2sh'
	| 'p2pkh'
	| any; //Unsure how to account for multisig variations (ex. 'MULTISIG-P2SH:2-4')

export type TGetByteCountOutput =
	| 'P2SH'
	| 'P2PKH'
	| 'P2WPKH'
	| 'P2WSH'
	| 'p2wpkh'
	| 'p2sh'
	| 'p2pkh';

export type TGetByteCountInputs = {
	[key in TGetByteCountInput]?: number;
};

export type TGetByteCountOutputs = {
	[key in TGetByteCountOutput]?: number;
};

export enum EOutput {
	address = '',
	value = 0,
	index = 0,
}

export enum ETransactionDefaults {
	recommendedBaseFee = 256, //Total recommended tx base fee in sats
	baseTransactionSize = 250, //In bytes (250 is about normal)
}

export enum EKeyDerivationAccount {
	onchain = 0,
}

export enum EAddressTypeNames {
	p2wpkh = 'Native Segwit',
	p2sh = 'Legacy Bitcoin address',
	p2pkh = 'Wrapped Segwit',
}

export enum EWallet {
	selectedNetwork = 'bitcoin',
	defaultWallet = 'wallet0',
	addressType = 'p2wpkh',
}

export interface IAddressData {
	path: string;
	type: 'p2wpkh' | 'p2sh' | 'p2pkh';
	label: string;
}

export interface IAddressType {
	[key: string]: IAddressData;
}

// m / purpose' / coin_type' / account' / change / address_index
export interface IKeyDerivationPath {
	purpose: TKeyDerivationPurpose;
	coinType: TKeyDerivationCoinType;
	account: TKeyDerivationAccount;
	change: TKeyDerivationChange;
	addressIndex: TKeyDerivationAddressIndex;
}

export interface IKeyDerivationPathData {
	pathString: string;
	pathObject: IKeyDerivationPath;
}

export interface IWallet {
	loading: boolean;
	walletExists: boolean;
	error: boolean;
	selectedNetwork: TAvailableNetworks;
	selectedWallet: string;
	addressTypes: IAddressType;
	exchangeRates: IExchangeRates;
	header: IWalletItem<IHeader>;
	wallets: { [key: string]: IDefaultWalletShape } | {};
	[key: string]: any;
}

export interface IWalletItem<T> {
	bitcoin: T;
	bitcoinTestnet: T;
	bitcoinRegtest: T;
	timestamp?: number | null;
}

export interface IAddressContent {
	index: number;
	path: string;
	address: string;
	scriptHash: string;
	publicKey: string;
}

export interface IAddress {
	[key: string]: IAddressContent;
}

export interface ICreateWallet {
	walletName?: string;
	mnemonic?: string;
	addressAmount?: number;
	changeAddressAmount?: number;
	addressTypes?: IAddressType;
	selectedNetwork?: TAvailableNetworks;
}

export interface IUtxo {
	address: string;
	index: number;
	path: string;
	scriptHash: string;
	height: number;
	tx_hash: string;
	tx_pos: number;
	value: number;
}

export interface IOutput {
	address?: string; //Address to send to.
	value?: number; //Amount denominated in sats.
	index?: number;
}

export interface IFormattedTransactionContent {
	address: string;
	height: number;
	scriptHash: string;
	totalInputValue: number;
	matchedInputValue: number;
	totalOutputValue: number;
	matchedOutputValue: number;
	fee: number;
	type: TTransactionType;
	value: number;
	txid: string;
	messages: string[];
	timestamp: number;
}
export interface IFormattedTransaction {
	[key: string]: IFormattedTransactionContent;
}

export interface IOnChainTransactionData {
	outputs?: IOutput[];
	inputs?: IUtxo[];
	changeAddress?: string;
	fiatAmount?: number;
	fee?: number; //Total fee in sats
	satsPerByte?: number;
	selectedFeeId?: EFeeIds;
	transactionSize?: number; //In bytes (250 is about normal)
	message?: string; // OP_RETURN data for a given transaction.
	label?: string; // User set label for a given transaction.
	rbf?: boolean;
	minFee?: number; // (sats) Used for RBF/CPFP transactions where the fee needs to be greater than the original.
	max?: boolean; // If the user intends to send the max amount.
	tags?: string[];
}

export const defaultOnChainTransactionData: IOnChainTransactionData = {
	outputs: [],
	inputs: [],
	changeAddress: '',
	fiatAmount: 0,
	fee: 256,
	satsPerByte: 1,
	selectedFeeId: EFeeIds.none,
	transactionSize: ETransactionDefaults.baseTransactionSize,
	message: '',
	label: '',
	rbf: false,
	minFee: 1,
	max: false,
	tags: [],
};

export interface IDefaultWalletShape {
	id: string;
	name: string;
	type: string;
	seedHash: string; // Help components/hooks recognize when a seed is set/updated for the same wallet id/name.
	addresses: IWalletItem<IAddress> | IWalletItem<{}>;
	addressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	changeAddresses: IWalletItem<IAddress> | IWalletItem<{}>;
	changeAddressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	utxos: IWalletItem<IUtxo[]>;
	boostedTransactions: IWalletItem<string[]>;
	transactions: IWalletItem<IFormattedTransaction> | IWalletItem<{}>;
	blacklistedUtxos: IWalletItem<[]>;
	balance: IWalletItem<number>;
	lastUpdated: IWalletItem<number>;
	hasBackedUpWallet: boolean;
	walletBackupTimestamp: string;
	keyDerivationPath: IWalletItem<IKeyDerivationPath>;
	networkTypePath: IWalletItem<string>;
	addressType: {
		bitcoin: TAddressType;
		bitcoinTestnet: TAddressType;
		bitcoinRegtest: TAddressType;
	};
	rbfData: IWalletItem<object>;
	transaction: IWalletItem<IOnChainTransactionData>;
}

export interface IDefaultWallet {
	[key: string]: IDefaultWalletShape;
}
