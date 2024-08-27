import {
	TBackupStateUpdate,
	TChannel as TLdkChannel,
	TClaimableBalance,
	TCreatePaymentReq,
	TInvoice,
} from '@synonymdev/react-native-ldk';
import { IWalletItem, TWalletName } from './wallet';
import { EAvailableNetwork } from '../../utils/networks';

export type IInvoice = {
	[key: string]: TInvoice;
};

export type TCreateLightningInvoice = TCreatePaymentReq & {
	selectedNetwork?: EAvailableNetwork;
	selectedWallet?: TWalletName;
};

export type TLdkAccountVersion = 1 | 2 | 3;

export enum EChannelStatus {
	open = 'open',
	pending = 'pending',
	closed = 'closed',
}

// TODO: move to react-native-ldk
export enum EChannelClosureReason {
	CommitmentTxConfirmed = 'CommitmentTxConfirmed',
	CounterpartyCoopClosedUnfundedChannel = 'CounterpartyCoopClosedUnfundedChannel',
	CounterpartyForceClosed = 'CounterpartyForceClosed',
	DisconnectedPeer = 'DisconnectedPeer',
	FundingBatchClosure = 'FundingBatchClosure',
	FundingTimedOut = 'FundingTimedOut',
	HolderForceClosed = 'HolderForceClosed',
	OutdatedChannelManager = 'OutdatedChannelManager',
	ProcessingError = 'ProcessingError',
	CounterpartyInitiatedCooperativeClosure = 'CounterpartyInitiatedCooperativeClosure',
	LegacyCooperativeClosure = 'LegacyCooperativeClosure',
	LocallyInitiatedCooperativeClosure = 'LocallyInitiatedCooperativeClosure',
	HTLCsTimedOut = 'HTLCsTimedOut',
	Unknown = 'Unknown',
}

// We collect all info about a channel from `TChannel`, `TChannelMonitor` and `TChannelManagerChannelClosed` plus some extra info.
export type TChannel = TLdkChannel & {
	status: EChannelStatus;
	claimable_balances: TClaimableBalance[];
	createdAt: number;
	closureReason?: EChannelClosureReason;
};

export type TNode = {
	nodeId: IWalletItem<string>;
	channels: IWalletItem<{ [key: string]: TChannel }>;
	info: IWalletItem<{}>;
	peers: IWalletItem<string[]>;
	backup: IWalletItem<TBackupStateUpdate>;
};

export type TNodes = {
	[walletName: TWalletName]: TNode;
};

export type TPendingPayment = {
	payment_hash: string;
	amount: number;
};

export type TLightningState = {
	accountVersion: TLdkAccountVersion;
	version: TLightningNodeVersion;
	nodes: TNodes;
	pendingPayments: TPendingPayment[];
};

export type TLightningNodeVersion = {
	ldk: string;
	c_bindings: string;
};

export type TChannels = {
	[id: string]: TChannel;
};
