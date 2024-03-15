import { LNURLChannelParams } from 'js-lnurl';
import { err, ok, Result } from '@synonymdev/result';
import { ldk, TInvoice } from '@synonymdev/react-native-ldk';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';
import { EPaymentType } from 'beignet';

import { dispatch, getLightningStore, getMetaDataStore } from '../helpers';
import { updateActivityItems } from '../slices/activity';
import {
	removeLightningPeer,
	removePendingPayment,
	saveLightningPeer,
	updateClaimableBalances,
	updateLightningChannels,
	updateLightningNodeId,
	updateLightningNodeVersion,
} from '../slices/lightning';
import { moveMetaIncTxTag } from '../slices/metadata';
import { updateTransfer } from '../actions/wallet';
import { EAvailableNetwork } from '../../utils/networks';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import {
	addPeers,
	createPaymentRequest,
	getChannels,
	getClaimableBalances,
	getClaimedLightningPayments,
	getCustomLightningPeers,
	getLdkChannels,
	getNodeVersion,
	getPendingInvoice,
	getSentLightningPayments,
	parseUri,
} from '../../utils/lightning';
import {
	EChannelStatus,
	TCreateLightningInvoice,
	TLightningNodeVersion,
	TChannel,
} from '../types/lightning';
import { ETransferType, TWalletName } from '../types/wallet';
import { EActivityType, TLightningActivityItem } from '../types/activity';

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
 * Attempts to update the lightning channels for the given wallet and network.
 * This method will save all channels (both pending, open & closed) to redux.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const updateLightningChannelsThunk = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	const result = await getLdkChannels();
	if (result.isErr()) {
		return err(result.error.message);
	}

	const ldkChannels = result.value;
	const storedChannels = getChannels();
	const channels: { [channelId: string]: TChannel } = {};

	ldkChannels.forEach((channel) => {
		const status = channel.is_channel_ready
			? EChannelStatus.open
			: EChannelStatus.pending;

		channels[channel.channel_id] = { ...channel, status };

		if (status === EChannelStatus.open && channel.funding_txid) {
			updateTransfer({
				txId: channel.funding_txid,
				type: ETransferType.open,
			});
		}
	});

	// LDK only returns open channels, so we need to compare with stored channels to find closed ones
	const closedChannels = storedChannels.filter(
		(o) => !ldkChannels.some((i) => i.channel_id === o.channel_id),
	);

	// Mark closed channels as such
	closedChannels.forEach((channel) => {
		channels[channel.channel_id] = {
			...channel,
			is_channel_ready: false,
			is_usable: false,
			status: EChannelStatus.closed,
		};
	});

	dispatch(
		updateLightningChannels({
			channels,
			selectedWallet,
			selectedNetwork,
		}),
	);

	return ok('Updated Lightning Channels');
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

export const updateClaimableBalancesThunk = async (): Promise<
	Result<string>
> => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	const claimableBalances = await getClaimableBalances();

	const payload = {
		claimableBalances,
		selectedNetwork,
		selectedWallet,
	};
	dispatch(updateClaimableBalances(payload));
	return ok('Successfully Updated Claimable Balance.');
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
