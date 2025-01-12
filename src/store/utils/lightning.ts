import { LNURLChannelParams } from 'js-lnurl';
import { err, ok, Result } from '@synonymdev/result';
import {
	ldk,
	TChannelManagerChannelClosed,
	TInvoice,
} from '@synonymdev/react-native-ldk';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';
import { EPaymentType } from 'beignet';

import {
	dispatch,
	getBlocktankStore,
	getLightningStore,
	getMetaDataStore,
} from '../helpers';
import { updateActivityItems } from '../slices/activity';
import {
	removeLightningPeer,
	removePendingPayment,
	saveLightningPeer,
	updateChannel,
	updateChannels,
	updateLightningNodeId,
	updateLightningNodeVersion,
} from '../slices/lightning';
import { moveMetaIncTxTag } from '../slices/metadata';
import { addTransfer, updateTransfer } from '../slices/wallet';
import { EAvailableNetwork } from '../../utils/networks';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import {
	addPeers,
	createPaymentRequest,
	getChannelMonitors,
	getClaimedLightningPayments,
	getCustomLightningPeers,
	getLdkChannels,
	getNodeVersion,
	getPendingInvoice,
	getSentLightningPayments,
	parseUri,
} from '../../utils/lightning';
import {
	EChannelClosureReason,
	EChannelStatus,
	TCreateLightningInvoice,
	TLightningNodeVersion,
} from '../types/lightning';
import { ETransferStatus, ETransferType, TWalletName } from '../types/wallet';
import { EActivityType, TLightningActivityItem } from '../types/activity';
import { reduceValue } from '../../utils/helpers';
import { getBlockHeader } from '../../utils/wallet/electrum';

/**
 * Attempts to update the node id for the selected wallet and network.
 */
export const updateLightningNodeIdThunk = async (): Promise<Result<string>> => {
	const selectedNetwork = getSelectedNetwork();
	const selectedWallet = getSelectedWallet();

	try {
		const result = await ldk.nodeId();
		if (result.isOk()) {
			dispatch(
				updateLightningNodeId({
					nodeId: result.value,
					selectedWallet,
					selectedNetwork,
				}),
			);
		}
		return ok('Updated nodeId.');
	} catch (e) {
		return err(e);
	}
};

/**
 * Attempts to grab, update and save the lightning node version to storage.
 * @returns {Promise<Result<TLightningNodeVersion>>}
 */
export const updateLightningNodeVersionThunk = async (): Promise<
	Result<TLightningNodeVersion>
> => {
	try {
		const version = await getNodeVersion();
		if (version.isErr()) {
			return err(version.error.message);
		}
		const currentVersion = getLightningStore()?.version;
		if (version.value.ldk !== currentVersion.ldk) {
			dispatch(updateLightningNodeVersion(version.value));
		}
		return ok(version.value);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Attempts to update the lightning channels for the current wallet and network.
 * This method will save all channels (both pending, open & closed) to redux.
 */
export const updateChannelsThunk = async (): Promise<Result<string>> => {
	const blockHeight = getBlockHeader().height;
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	const channelsResult = await getLdkChannels();
	if (channelsResult.isErr()) {
		return err(channelsResult.error.message);
	}
	const channelMonitorsResult = await getChannelMonitors();
	if (channelMonitorsResult.isErr()) {
		return err(channelMonitorsResult.error.message);
	}
	const channels = channelsResult.value;
	const channelMonitors = channelMonitorsResult.value;

	// Update the transfer status for pending channels.
	channels.forEach((channel) => {
		if (channel.funding_txid) {
			const { funding_txid, confirmations, confirmations_required } = channel;
			let txId = funding_txid;
			const confirmsIn = Math.max(confirmations_required! - confirmations, 0);

			// If the channel is opened by Blocktank, get the payment txId from the order.
			const orders = getBlocktankStore().orders;
			const order = orders.find((o) => o.channel?.fundingTx.id === txId);
			if (order) {
				txId = order.payment.onchain.transactions[0].txId;
			}

			dispatch(updateTransfer({ txId, confirmsIn }));
		}
	});

	// Update transfers for closed channels
	channelMonitors.forEach(({ funding_txo_txid, claimable_balances }) => {
		const txId = funding_txo_txid;
		const amountRes = reduceValue(claimable_balances, 'amount_satoshis');
		const amount = amountRes.isOk() ? amountRes.value : 0;

		let confirmationHeight = 0;
		if (claimable_balances.length > 0) {
			// Default to 6 confirmations if no confirmation height (closing transaction has not yet appeared in a block)
			confirmationHeight =
				claimable_balances[0].confirmation_height ?? blockHeight + 6;
		}
		const confirmsIn = Math.max(confirmationHeight - blockHeight, 0);

		dispatch(updateTransfer({ txId, confirmsIn, amount }));
	});

	dispatch(
		updateChannels({
			channels,
			channelMonitors,
			selectedWallet,
			selectedNetwork,
		}),
	);

	return ok('Updated Lightning Channels');
};

export const closeChannelThunk = async (
	res: TChannelManagerChannelClosed,
): Promise<void> => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	const channelMonitorsResult = await getChannelMonitors();
	if (channelMonitorsResult.isErr()) {
		console.error(channelMonitorsResult.error.message);
		return;
	}
	const channelMonitors = channelMonitorsResult.value;
	const channelMonitor = channelMonitors.find(({ channel_id }) => {
		return channel_id === res.channel_id;
	});

	if (channelMonitor) {
		// update the channel with the closure reason
		dispatch(
			updateChannel({
				channelData: {
					channel_id: res.channel_id,
					status: EChannelStatus.closed,
					claimable_balances: channelMonitor.claimable_balances,
					closureReason: res.reason as EChannelClosureReason,
					is_channel_ready: false,
					is_usable: false,
				},
				selectedWallet,
				selectedNetwork,
			}),
		);

		// Add a transfer for the closed channel
		const claimableBalances = channelMonitor.claimable_balances;
		const amountRes = reduceValue(claimableBalances, 'amount_satoshis');
		const amount = amountRes.isOk() ? amountRes.value : 0;

		const blockHeight = getBlockHeader().height;
		const type =
			res.reason === EChannelClosureReason.LocallyInitiatedCooperativeClosure
				? ETransferType.coopClose
				: ETransferType.forceClose;

		let confirmationHeight = 0;
		if (claimableBalances.length > 0) {
			// Default to 6 confirmations if no confirmation height (closing transaction has not yet appeared in a block)
			confirmationHeight =
				claimableBalances[0].confirmation_height ?? blockHeight + 6;
		}

		const txId = channelMonitor.funding_txo_txid;
		let status = ETransferStatus.pending;
		let confirmsIn = Math.max(confirmationHeight - blockHeight, 0);

		// for coop closes, ignore the anti reorg delay (6 blocks) from LDK
		// consider funds as immediately available
		if (type === ETransferType.coopClose) {
			status = ETransferStatus.done;
			confirmsIn = 0;
		}

		dispatch(addTransfer({ type, status, txId, amount, confirmsIn }));
	}
};

/**
 * Claims a lightning channel from a lnurl-channel string
 * @param {string} lnurl
 * @returns {Promise<Result<string>>}
 */
export const claimChannelFromLnurlString = async (
	lnurl: string,
): Promise<Result<string>> => {
	const res = await getLNURLParams(lnurl);
	if (res.isErr()) {
		return err(res.error);
	}

	const params = res.value as LNURLChannelParams;
	if (params.tag !== 'channelRequest') {
		return err('Not a channel request lnurl');
	}

	return claimChannel(params);
};

/**
 * Claims a lightning channel from a decoded lnurl-channel request
 * @param {LNURLChannelParams} params
 * @returns {Promise<Result<string>>}
 */
export const claimChannel = async (
	params: LNURLChannelParams,
): Promise<Result<string>> => {
	// TODO: Connect to peer from URI.
	const lnurlRes = await lnurlChannel({
		params,
		isPrivate: true,
		cancel: false,
		localNodeId: '',
	});

	if (lnurlRes.isErr()) {
		return err(lnurlRes.error);
	}

	return ok(lnurlRes.value);
};

/**
 * Creates and stores a lightning invoice, for the specified amount, and refreshes/re-adds peers.
 * @param {number} amountSats
 * @param {string} [description]
 * @param {number} [expiryDeltaSeconds]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const createLightningInvoice = async ({
	amountSats,
	description,
	expiryDeltaSeconds,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: TCreateLightningInvoice): Promise<Result<TInvoice>> => {
	const invoice = await createPaymentRequest({
		amountSats,
		description,
		expiryDeltaSeconds,
	});
	if (invoice.isErr()) {
		return err(invoice.error.message);
	}

	addPeers({ selectedNetwork, selectedWallet }).then();

	return ok(invoice.value);
};

/**
 * Attempts to save a custom lightning peer to storage.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} peer
 */
export const savePeer = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	peer: string;
}): Result<string> => {
	if (!peer) {
		return err('The peer data appears to be invalid.');
	}
	// Check that the URI is valid.
	const parsedPeerData = parseUri(peer);
	if (parsedPeerData.isErr()) {
		return err(parsedPeerData.error.message);
	}
	// Ensure we haven't already added this peer.
	const existingPeers = getCustomLightningPeers({
		selectedWallet,
		selectedNetwork,
	});
	if (existingPeers.includes(peer)) {
		return ok('Peer Already Added');
	}
	const payload = {
		peer,
		selectedWallet,
		selectedNetwork,
	};
	dispatch(saveLightningPeer(payload));
	return ok('Lightning Peer Saved');
};

/**
 * Attempts to remove a custom lightning peer from storage.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {string} peer
 * @returns {Result<string>}
 */
export const removePeer = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	peer: string;
}): Result<string> => {
	if (!peer) {
		return err('The peer data appears to be invalid.');
	}
	const payload = {
		peer,
		selectedWallet,
		selectedNetwork,
	};
	dispatch(removeLightningPeer(payload));
	return ok('Successfully Removed Lightning Peer');
};

export const syncLightningTxsWithActivityList = async (): Promise<
	Result<string>
> => {
	const items: TLightningActivityItem[] = [];

	const claimed = await getClaimedLightningPayments();
	for (const payment of claimed) {
		// Required to add in bolt11 and description
		const invoice = await getPendingInvoice(payment.payment_hash);

		items.push({
			id: payment.payment_hash,
			activityType: EActivityType.lightning,
			txType: EPaymentType.received,
			status: 'successful',
			message: invoice?.description ?? '',
			address: invoice?.to_str ?? '',
			confirmed: payment.state === 'successful',
			value: payment.amount_sat,
			timestamp: payment.unix_timestamp * 1000,
			preimage: payment.payment_preimage,
		});
	}

	// Remove pending payments from store that are no longer pending
	const sent = await getSentLightningPayments();
	const pendingPayments = sent.filter((p) => p.state === 'pending');
	const pendingWatched = getLightningStore().pendingPayments;
	const pendingToRemove = pendingWatched.filter((p) => {
		return !pendingPayments.find((pp) => pp.payment_hash === p.payment_hash);
	});

	if (pendingToRemove.length > 0) {
		pendingToRemove.forEach(({ payment_hash }) => {
			dispatch(removePendingPayment(payment_hash));
		});
	}

	for (const payment of sent) {
		if (!payment.amount_sat) {
			continue;
		}

		items.push({
			id: payment.payment_hash,
			activityType: EActivityType.lightning,
			txType: EPaymentType.sent,
			status: payment.state,
			message: payment.description ?? '',
			address: payment.bolt11_invoice ?? '',
			confirmed: payment.state === 'successful',
			value: payment.amount_sat,
			fee: payment.fee_paid_sat ?? 0,
			timestamp: payment.unix_timestamp * 1000,
			preimage: payment.payment_preimage,
		});
	}

	dispatch(updateActivityItems(items));

	return ok('Stored lightning transactions synced with activity list.');
};

/**
 * Moves pending tags to metadata store linked to received payment
 * @param {TInvoice} invoice
 * @returns {Result<string>}
 */
export const moveMetaIncPaymentTags = (invoice: TInvoice): Result<string> => {
	const { pendingInvoices } = getMetaDataStore();
	const matched = pendingInvoices.find((item) => {
		return item.payReq === invoice.to_str;
	});

	if (matched) {
		const newPending = pendingInvoices.filter((item) => item !== matched);

		dispatch(
			moveMetaIncTxTag({
				pendingInvoices: newPending,
				tags: { [invoice.payment_hash]: matched.tags },
			}),
		);
	}

	return ok('Metadata tags resynced with transactions.');
};
