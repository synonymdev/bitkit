import { LNURLChannelParams } from 'js-lnurl';
import { err, ok, Result } from '@synonymdev/result';
import { TChannel, TInvoice } from '@synonymdev/react-native-ldk';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';

import actions from './actions';
import { getDispatch, getLightningStore, getMetaDataStore } from '../helpers';
import { TAvailableNetworks } from '../../utils/networks';
import { getActivityItemById } from '../../utils/activity';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import {
	addPeers,
	createPaymentRequest,
	getClaimableBalance,
	getClaimedLightningPayments,
	getCustomLightningPeers,
	getLightningChannels,
	getNodeIdFromStorage,
	getNodeVersion,
	getPendingInvoice,
	getSentLightningPayments,
	parseUri,
} from '../../utils/lightning';
import {
	TCreateLightningInvoice,
	TLdkAccountVersions,
	TLightningNodeVersion,
} from '../types/lightning';
import { EPaymentType, TWalletName } from '../types/wallet';
import { EActivityType, TLightningActivityItem } from '../types/activity';

const dispatch = getDispatch();

/**
 * Attempts to update the node id for the given wallet and network.
 * @param {string} nodeId
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateLightningNodeId = ({
	nodeId,
	selectedWallet,
	selectedNetwork,
}: {
	nodeId: string;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Result<string> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const nodeIdFromStorage = getNodeIdFromStorage({
		selectedWallet,
		selectedNetwork,
	});
	if (nodeId && nodeIdFromStorage !== nodeId) {
		const payload = {
			nodeId,
			selectedWallet,
			selectedNetwork,
		};
		dispatch({
			type: actions.UPDATE_LIGHTNING_NODE_ID,
			payload,
		});
	}
	return ok('No need to update nodeId.');
};

/**
 * Attempts to grab, update and save the lightning node version to storage.
 * @returns {Promise<Result<TLightningNodeVersion>>}
 */
export const updateLightningNodeVersion = async (): Promise<
	Result<TLightningNodeVersion>
> => {
	try {
		const version = await getNodeVersion();
		if (version.isErr()) {
			return err(version.error.message);
		}
		const currentVersion = getLightningStore()?.version;
		if (version.value.ldk !== currentVersion.ldk) {
			dispatch({
				type: actions.UPDATE_LIGHTNING_NODE_VERSION,
				payload: { version: version.value },
			});
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
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateLightningChannels = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TChannel[]>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const lightningChannels = await getLightningChannels();
	if (lightningChannels.isErr()) {
		return err(lightningChannels.error.message);
	}

	const channels: { [channelId: string]: TChannel } = {};
	const openChannelIds: string[] = [];

	lightningChannels.value.forEach((channel) => {
		channels[channel.channel_id] = channel;
		if (!openChannelIds.includes(channel.channel_id)) {
			openChannelIds.push(channel.channel_id);
		}
	});

	const payload = {
		channels,
		openChannelIds,
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.UPDATE_LIGHTNING_CHANNELS,
		payload,
	});
	return ok(lightningChannels.value);
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
 * @param {TAvailableNetworks} [selectedNetwork]
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

/*
 * This resets the lightning store to defaultLightningShape
 */
export const resetLightningStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_LIGHTNING_STORE,
	});
	return ok('');
};

/**
 * Attempts to save a custom lightning peer to storage.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} peer
 */
export const savePeer = ({
	selectedWallet,
	selectedNetwork,
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
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
	dispatch({
		type: actions.SAVE_LIGHTNING_PEER,
		payload,
	});
	return ok('Lightning Peer Saved');
};

/**
 * Attempts to remove a custom lightning peer from storage.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} peer
 * @returns {Result<string>}
 */
export const removePeer = ({
	selectedWallet,
	selectedNetwork,
	peer,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
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
	dispatch({
		type: actions.REMOVE_LIGHTNING_PEER,
		payload,
	});
	return ok('Successfully Removed Lightning Peer');
};

export const updateClaimableBalance = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const claimableBalance = await getClaimableBalance({
		selectedNetwork,
		selectedWallet,
	});

	const payload = {
		selectedNetwork,
		selectedWallet,
		claimableBalance,
	};

	dispatch({
		type: actions.UPDATE_CLAIMABLE_BALANCE,
		payload,
	});
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
		if (!sats || tx.state !== 'successful') {
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

	dispatch({
		type: actions.UPDATE_ACTIVITY_ITEMS,
		payload: items,
	});

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

		dispatch({
			type: actions.MOVE_META_INC_TX_TAG,
			payload: {
				pendingInvoices: newPending,
				tags: { [invoice.payment_hash]: matched.tags },
			},
		});
	}

	return ok('Metadata tags resynced with transactions.');
};

export const updateLdkAccountVersion = (
	accountVersion: TLdkAccountVersions,
): TLdkAccountVersions => {
	dispatch({
		type: actions.UPDATE_LDK_ACCOUNT_VERSION,
		payload: {
			accountVersion,
		},
	});
	return accountVersion;
};
