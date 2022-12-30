import { TAvailableNetworks } from '../../utils/networks';
import { IExchangeRates } from '../../utils/exchange-rate/types';
import { IAddressTypeContent } from '../shapes/wallet';
import { EFeeIds } from './fees';
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
}

export type TKeyDerivationAccountType = 'onchain';
export type TKeyDerivationPurpose = '84' | '49' | '44' | string; //"p2wpkh" | "p2sh" | "p2pkh";
export type TKeyDerivationCoinType = '0' | '1' | string; //"mainnet" | "testnet";
export type TKeyDerivationAccount = '0' | string; //"On-Chain Wallet";
export type TKeyDerivationChange = '0' | '1' | string; //"Receiving Address" | "Change Address";
export type TKeyDerivationAddressIndex = string;
export type TAssetType = 'bitcoin' | 'tether';
export type TAssetNetwork = 'bitcoin' | 'lightning';

export type NetworkTypePath = '0' | '1'; //"mainnet" | "testnet"

export enum EBitcoinUnit {
	satoshi = 'satoshi',
	BTC = 'BTC',
	mBTC = 'mBTC',
	μBTC = 'μBTC',
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
	dustLimit = 546, //Minimum value in sats for an output. Outputs below the dust limit may not be processed because the fees required to include them in a block would be greater than the value of the transaction itself.
}

export enum EKeyDerivationAccount {
	onchain = 0,
}

export enum EBoost {
	rbf = 'rbf',
	cpfp = 'cpfp',
}

export interface IAddressData {
	type: EAddressType;
	path: string;
	label: string;
}

export type IAddressTypes = {
	[key in EAddressType]: IAddressData;
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

export interface IWallet {
	walletExists: boolean;
	selectedNetwork: TAvailableNetworks;
	selectedWallet: TWalletName;
	addressTypes: IAddressTypes;
	exchangeRates: IExchangeRates;
	header: IWalletItem<IHeader>;
	wallets: { [key: TWalletName]: IDefaultWalletShape };
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

export interface IFormattedTransactionContent {
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
	[key: string]: IFormattedTransactionContent;
}

export interface IBitcoinTransactionData {
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
	boostType?: EBoost;
	minFee?: number; // (sats) Used for RBF/CPFP transactions where the fee needs to be greater than the original.
	max?: boolean; // If the user intends to send the max amount.
	tags?: string[];
	slashTagsUrl?: string;
	lightningInvoice?: string;
}

export const defaultBitcoinTransactionData: IBitcoinTransactionData = {
	outputs: [EOutput],
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
	boostType: EBoost.cpfp,
	minFee: 1,
	max: false,
	tags: [],
	lightningInvoice: '',
};

export interface IBoostedTransaction {
	parentTransactions: string[]; // Array of parent txids to the currently boosted transaction.
	childTransaction: string; // Child txid of the currently boosted transaction.
	type: EBoost;
	fee: number;
}

export interface IBoostedTransactions {
	[key: string]: IBoostedTransaction;
}

export interface IDefaultWalletShape {
	id: TWalletName;
	name: string;
	type: string;
	seedHash?: string; // Help components/hooks recognize when a seed is set/updated for the same wallet id/name.
	addresses: IWalletItem<IAddress> | IWalletItem<{}>;
	addressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	lastUsedAddressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	changeAddresses: IWalletItem<IAddress> | IWalletItem<{}>;
	changeAddressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	lastUsedChangeAddressIndex: IWalletItem<IAddressTypeContent<IAddressContent>>;
	utxos: IWalletItem<IUtxo[]>;
	boostedTransactions: IWalletItem<IBoostedTransactions> | IWalletItem<{}>;
	transactions: IWalletItem<IFormattedTransactions> | IWalletItem<{}>;
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

export interface IDefaultWallet {
	[key: TWalletName]: IDefaultWalletShape;
}
