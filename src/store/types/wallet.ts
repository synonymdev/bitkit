import { EAvailableNetwork } from '../../utils/networks';
import { IExchangeRates } from '../../utils/exchange-rate';
import { IAddressTypeContent } from '../shapes/wallet';
import { IHeader } from '../../utils/types/electrum';
import {
	EAddressType,
	IFormattedTransaction,
	ISendTransaction,
	TServer,
} from 'beignet';

export enum EPaymentType {
	sent = 'sent',
	received = 'received',
}

export type TKeyDerivationAccountType = 'onchain';
export type TKeyDerivationPurpose = '86' | '84' | '49' | '44'; //"p2tr" | "p2wpkh" | "p2sh" | "p2pkh";
export type TKeyDerivationCoinType = '0' | '1'; //"mainnet" | "testnet";
export type TKeyDerivationAccount = '0'; //"On-Chain Wallet";
export type TKeyDerivationChange = '0' | '1'; //"Receiving Address" | "Change Address";
export type TKeyDerivationAddressIndex = string;
export type TAssetType = 'bitcoin' | 'tether';

export enum EConversionUnit {
	satoshi = 'satoshi',
	BTC = 'BTC',
	fiat = 'fiat',
}

export enum EUnit {
	BTC = 'BTC',
	fiat = 'fiat',
}

export enum EDenomination {
	modern = 'modern',
	classic = 'classic',
}

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
	| 'p2sh'
	| 'P2TR'
	| 'p2tr';

export type TGetByteCountOutput =
	| 'P2SH'
	| 'P2PKH'
	| 'P2WPKH'
	| 'P2WSH'
	| 'p2wpkh'
	| 'p2sh'
	| 'p2pkh'
	| 'P2TR'
	| 'p2tr';

export type TGetByteCountInputs = {
	[key in TGetByteCountInput]?: number;
};

export type TGetByteCountOutputs = {
	[key in TGetByteCountOutput]?: number;
};

export enum EBoostType {
	rbf = 'rbf',
	cpfp = 'cpfp',
}

export interface IAddressTypeData {
	type: EAddressType;
	path: string;
	name: string;
	shortName: string;
	description: string;
	example: string;
}

export type IAddressTypes = {
	[key in EAddressType]: Readonly<IAddressTypeData>;
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

export type TProcessUnconfirmedTransactions = {
	unconfirmedTxs: IFormattedTransactions; // zero-conf transactions
	outdatedTxs: IUtxo[]; // Transactions that are no longer confirmed.
	ghostTxs: string[]; // Transactions that have been removed from the mempool.
};

export type TWalletName = `wallet${number}`;

export interface IWalletStore {
	walletExists: boolean;
	selectedNetwork: EAvailableNetwork;
	selectedWallet: TWalletName;
	exchangeRates: IExchangeRates;
	header: IWalletItem<IHeader>;
	addressTypesToMonitor: EAddressType[];
	wallets: { [key: TWalletName]: IWallet };
}

export interface IWalletItem<T> {
	[EAvailableNetwork.bitcoin]: T;
	[EAvailableNetwork.bitcoinTestnet]: T;
	[EAvailableNetwork.bitcoinRegtest]: T;
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
	mnemonic: string;
	bip39Passphrase?: string;
	restore?: boolean;
	addressAmount?: number;
	changeAddressAmount?: number;
	addressTypesToCreate?: EAddressType[];
	selectedNetwork?: EAvailableNetwork;
	servers?: TServer | TServer[];
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
	address: string; // Address to send to.
	value: number; // Amount denominated in sats.
	index: number; // Used to specify which output to update or edit when using updateSendTransaction.
}

export interface IFormattedTransactions {
	[txId: string]: IFormattedTransaction;
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

export type TTransfer = TTransferToSpending | TTransferToSavings;

export enum ETransferType {
	open = 'open',
	coopClose = 'coop-close',
	forceClose = 'force-close',
}

export enum ETransferStatus {
	pending = 'pending',
	done = 'done',
}

export type TTransferToSpending = {
	txId: string; // The txId of the transaction that paid for the channel.
	type: ETransferType.open;
	orderId: string;
	status: ETransferStatus.pending | ETransferStatus.done;
	amount: number;
};

export type TTransferToSavings = {
	txId: string; // The txId of the transaction that closed the channel.
	type: ETransferType.coopClose | ETransferType.forceClose;
	status: ETransferStatus.pending | ETransferStatus.done;
	amount: number;
	confirmations: number;
};

export interface IWallet {
	id: string;
	name: string;
	seedHash?: string; // Help components/hooks recognize when a seed is set/updated for the same wallet id/name.
	addresses: IWalletItem<IAddressTypeContent<IAddresses>>;
	addressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	lastUsedAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	changeAddresses: IWalletItem<IAddressTypeContent<IAddresses>>;
	changeAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	lastUsedChangeAddressIndex: IWalletItem<IAddressTypeContent<IAddress>>;
	utxos: IWalletItem<IUtxo[]>;
	blacklistedUtxos: IWalletItem<[]>;
	boostedTransactions: IWalletItem<IBoostedTransactions>;
	unconfirmedTransactions: IWalletItem<IFormattedTransactions>;
	transfers: IWalletItem<TTransfer[]>;
	transactions: IWalletItem<IFormattedTransactions>;
	transaction: IWalletItem<ISendTransaction>;
	balance: IWalletItem<number>;
	addressType: IWalletItem<EAddressType>;
}

export interface IWallets {
	[key: TWalletName]: IWallet;
}
