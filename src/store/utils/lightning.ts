import { LNURLChannelParams } from 'js-lnurl';
import { err, ok, Result } from '@synonymdev/result';
import { ldk, TChannel, TInvoice } from '@synonymdev/react-native-ldk';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';

import { dispatch, getLightningStore, getMetaDataStore } from '../helpers';
import { updateActivityItems } from '../slices/activity';
import {
	removeLightningPeer,
	saveLightningPeer,
	updateClaimableBalances,
	updateLightningChannels,
	updateLightningNodeId,
	updateLightningNodeVersion,
} from '../slices/lightning';
import { moveMetaIncTxTag } from '../slices/metadata';
import { updateTransfer } from '../actions/wallet';
import { EAvailableNetwork } from '../../utils/networks';
import { getActivityItemById } from '../../utils/activity';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import {
	addPeers,
	createPaymentRequest,
	getClaimableBalances,
	getClaimedLightningPayments,
	getCustomLightningPeers,
	getLightningChannels,
	getNodeVersion,
	getPendingInvoice,
	getSentLightningPayments,
	parseUri,
} from '../../utils/lightning';
import {
	TCreateLightningInvoice,
	TLightningNodeVersion,
} from '../types/lightning';
import { EPaymentType, ETransferType, TWalletName } from '../types/wallet';
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
 * This method will save all channels (both pending, open & closed) to redux and update openChannelIds to reference channels that are currently open.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const updateLightningChannelsThunk = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const lightningChannelsRes = await getLightningChannels();
	if (lightningChannelsRes.isErr()) {
		return err(lightningChannelsRes.error.message);
	}

	const channels: { [channelId: string]: TChannel } = {};
	const openChannelIds: string[] = [];
	const lightningChannels = lightningChannelsRes.value;

	lightningChannels.forEach((channel) => {
		channels[channel.channel_id] = channel;
		if (!openChannelIds.includes(channel.channel_id)) {
			openChannelIds.push(channel.channel_id);

			if (channel.is_channel_ready && channel.funding_txid) {
				updateTransfer({
					txId: channel.funding_txid,
					type: ETransferType.open,
				});
			}
		}
	});

	dispatch(
		updateLightningChannels({
			channels,
			openChannelIds,
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
	selectedNetwork,
	selectedWallet,
}: TCreateLightningInvoice): Promise<Result<TInvoice>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
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
	selectedWallet,
	selectedNetwork,
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	peer: string;
}): Result<string> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

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
	selectedWallet,
	selectedNetwork,
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	peer: string;
}): Result<string> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
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
	let items: TLightningActivityItem[] = [];

	const claimedTxs = await getClaimedLightningPayments();
	for (const tx of claimedTxs) {
		//Required to add in bolt11 and description
		const invoice = await getPendingInvoice(tx.payment_hash);

		items.push({
			id: tx.payment_hash,
			activityType: EActivityType.lightning,
			txType: EPaymentType.received,
			message: invoice?.description ?? '',
			address: invoice?.to_str ?? '',
			confirmed: tx.state === 'successful',
			value: tx.amount_sat,
			timestamp: tx.unix_timestamp * 1000,
		});
	}

	const sentTxs = await getSentLightningPayments();
	for (const tx of sentTxs) {
		const sats = tx.amount_sat;
		if (!sats || tx.state === 'failed') {
			continue;
		}

		items.push({
			id: tx.payment_hash,
			activityType: EActivityType.lightning,
			txType: EPaymentType.sent,
			message: '',
			address: '',
			confirmed: tx.state === 'successful',
			value: sats,
			fee: tx.fee_paid_sat ?? 0,
			timestamp: tx.unix_timestamp * 1000,
		});
	}

	//TODO remove temp hack when this is complete and descriptions/bolt11 can be added from stored tx: https://github.com/synonymdev/react-native-ldk/issues/156
	items.forEach((item) => {
		const res = getActivityItemById(item.id);
		if (res.isOk()) {
			const existingItem = res.value;
			if (existingItem.activityType === EActivityType.lightning) {
				item.message = existingItem.message;
				item.address = existingItem.address;
			}
		}
	});

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
