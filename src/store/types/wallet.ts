import { TAvailableNetworks } from '../../utils/networks';
import { IExchangeRates } from '../../utils/exchange-rate/types';
import { IAddressTypeContent } from '../shapes/wallet';
import { EFeeId } from './fees';
import { IHeader } from '../../utils/types/electrum';

export enum EPaymentType {
	sent = 'sent',
	received = 'received',
}

export enum EAddressType {
	p2wpkh = 'p2wpkh',
	p2sh = 'p2sh',
	p2pkh = 'p2pkh',
	// p2wsh = 'p2wsh',
	// p2tr = 'p2tr',
}

export type TKeyDerivationAccountType = 'onchain';
export type TKeyDerivationPurpose = '84' | '49' | '44'; //"p2wpkh" | "p2sh" | "p2pkh";
export type TKeyDerivationCoinType = '0' | '1'; //"mainnet" | "testnet";
export type TKeyDerivationAccount = '0'; //"On-Chain Wallet";
export type TKeyDerivationChange = '0' | '1'; //"Receiving Address" | "Change Address";
export type TKeyDerivationAddressIndex = string;
export type TAssetType = 'bitcoin' | 'tether';

export type NetworkTypePath = '0' | '1'; //"mainnet" | "testnet"

export enum EBitcoinUnit {
	satoshi = 'satoshi',
	BTC = 'BTC',
	// mBTC = 'mBTC',
	// μBTC = 'μBTC',
}

export enum EBalanceUnit {
	satoshi = 'satoshi',
	BTC = 'BTC',
	fiat = 'fiat',
}

export type TBitcoinAbbreviation = 'sats' | 'BTC';

export type TBitcoinLabel =
	| 'Bitcoin Mainnet'
	| 'Bitcoin Testnet'
	| 'Bitcoin Regtest';

export type TTicker = 'BTC' | 'tBTC';

export type TGetByteCountInput =
	| `MULTISIG-P2SH:${number}-${number}`
	| `MULTISIG-P2WSH:${number}-${number}`
	| `MULTISIG-P2SH-P2WSH:${number}-${number}`
	| 'P2SH-P2WPKH'
	| 'P2PKH'
	| 'p2pkh'
	| 'P2WPKH'
	| 'p2wpkh'
	| 'P2SH'
	| 'p2sh';

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

export enum EKeyDerivationAccount {
	onchain = 0,
}

export enum EBoostType {
	rbf = 'rbf',
	cpfp = 'cpfp',
}

export interface IAddressTypeData {
	type: EAddressType;
	path: string;
	label: string;
}

export type IAddressTypes = {
	[key in EAddressType]: IAddressTypeData;
};

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

export type TWalletName = `wallet${number}`;

export interface IWalletStore {
	walletExists: boolean;
	selectedNetwork: TAvailableNetworks;
	selectedWallet: TWalletName;
	addressTypes: IAddressTypes;
	exchangeRates: IExchangeRates;
	header: IWalletItem<IHeader>;
	wallets: { [key: TWalletName]: IWallet };
}

export interface IWalletItem<T> {
	bitcoin: T;
	bitcoinTestnet: T;
	bitcoinRegtest: T;
	timestamp?: number | null;
}

export interface IAddress {
	index: number;
	path: string;
	address: string;
	scriptHash: string;
	publicKey: string;
}

export interface IAddresses {
	[scriptHash: string]: IAddress;
}

export interface ICreateWallet {
	walletName?: TWalletName;
	mnemonic?: string;
	bip39Passphrase?: string;
	addressAmount?: number;
	changeAddressAmount?: number;
	addressTypes?: Partial<IAddressTypes>;
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
	index: number; //Used to specify which output to update or edit when using updateBitcoinTransaction.
}

export interface IFormattedTransaction {
	address: string;
	height: number;
	scriptHash: string;
	totalInputValue: number;
	matchedInputValue: number;
	totalOutputValue: number;
	matchedOutputValue: number;
	fee: number;
	satsPerByte: number;
	type: EPaymentType;
	value: number;
	txid: string;
	messages: string[];
	timestamp: number;
}

export interface IFormattedTransactions {
	[key: string]: IFormattedTransaction;
}

export interface IBitcoinTransactionData {
	outputs: IOutput[];
	inputs: IUtxo[];
	changeAddress: string;
	fiatAmount: number;
	fee: number; //Total fee in sats
	satsPerByte: number;
	selectedFeeId: EFeeId;
	message: string; // OP_RETURN data for a given transaction.
	label: string; // User set label for a given transaction.
	rbf: boolean;
	boostType: EBoostType;
	minFee: number; // (sats) Used for RBF/CPFP transactions where the fee needs to be greater than the original.
	max: boolean; // If the user intends to send the max amount.
	tags: string[];
	slashTagsUrl?: string;
	lightningInvoice?: string;
}

export interface IBoostedTransaction {
	parentTransactions: string[]; // Array of parent txids to the currently boosted transaction.
	childTransaction: string; // Child txid of the currently boosted transaction.
	type: EBoostType;
	fee: number;
}

export interface IBoostedTransactions {
	[txId: string]: IBoostedTransaction;
}

export interface IWallet {
	id: TWalletName;
	name: string;
	type: string;
	seedHash?: string; // Help components/hooks recognize when a seed is set/updated for the same wallet id/name.
	addresses: IWalletItem<IAddressTypeContent<IAddresses>>;
	addressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	lastUsedAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	changeAddresses: IWalletItem<IAddressTypeContent<IAddresses>>;
	changeAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	lastUsedChangeAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	utxos: IWalletItem<IUtxo[]>;
	boostedTransactions: IWalletItem<IBoostedTransactions>;
	transactions: IWalletItem<IFormattedTransactions>;
	blacklistedUtxos: IWalletItem<[]>;
	balance: IWalletItem<number>;
	lastUpdated: IWalletItem<number>;
	hasBackedUpWallet: boolean;
	walletBackupTimestamp: string;
	keyDerivationPath: IWalletItem<IKeyDerivationPath>;
	networkTypePath: IWalletItem<string>;
	addressType: {
		bitcoin: EAddressType;
		bitcoinTestnet: EAddressType;
		bitcoinRegtest: EAddressType;
	};
	rbfData: IWalletItem<object>;
	transaction: IWalletItem<IBitcoinTransactionData>;
}

export interface IWallets {
	[key: TWalletName]: IWallet;
}
