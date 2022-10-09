import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { err, ok, Result } from '@synonymdev/result';
import { LNURLChannelParams } from 'js-lnurl';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import { TAvailableNetworks } from '../../utils/networks';
import {
	addPeers,
	createPaymentRequest,
	getLightningChannels,
	getNodeIdFromStorage,
	getNodeVersion,
	hasOpenLightningChannels,
} from '../../utils/lightning';
import { TChannel, TInvoice } from '@synonymdev/react-native-ldk';
import {
	TCreateLightningInvoice,
	TLightningNodeVersion,
} from '../types/lightning';
import { showSuccessNotification } from '../../utils/notifications';

const dispatch = getDispatch();

/**
 * Attempts to update the node id for the given wallet and network.
 * @param {string} nodeId
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateLightningNodeId = async ({
	nodeId,
	selectedWallet,
	selectedNetwork,
}: {
	nodeId: string;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
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
 * Attempts to update the lightning channels for the given wallet and network.
 * This method will save all channels (both pending, open & closed) to redux and update openChannelIds to reference channels that are currently open.
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const updateLightningChannels = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TChannel[]>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const oldOpenChannelIds =
		getStore().lightning.nodes[selectedWallet].openChannelIds[selectedNetwork];
	const lightningChannels = await getLightningChannels();
	if (lightningChannels.isErr()) {
		return err(lightningChannels.error.message);
	}

	const channels: { [key: string]: TChannel } = {};
	const openChannelIds: string[] = [];
	await Promise.all(
		lightningChannels.value.map((channel) => {
			channels[channel.channel_id] = channel;
			if (!openChannelIds.includes(channel.channel_id)) {
				openChannelIds.push(channel.channel_id);
			}
		}),
	);
	// TODO: Remove this once listeners are added in the next react-native-ldk version.
	if (oldOpenChannelIds.length < openChannelIds.length) {
		showSuccessNotification({
			title: 'Lightning Channel Opened',
			message: 'Congrats! A new lightning channel was successfully opened.',
		});
	}
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
		const currentVersion = getStore()?.lightning?.version;
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
 * Claims a lightning channel from a lnurl-channel string
 * @param {string} lnurl
 * @returns {Promise<Result<string>>}
 */
export const claimChannelFromLnurlString = (
	lnurl: string,
): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await getLNURLParams(lnurl);
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		const params = res.value as LNURLChannelParams;
		if (params.tag !== 'channelRequest') {
			return resolve(err('Not a channel request lnurl'));
		}

		resolve(claimChannel(params));
	});
};

/**
 * Claims a lightning channel from a decoded lnurl-channel request
 * @param {LNURLChannelParams} params
 * @returns {Promise<Result<string>>}
 */
export const claimChannel = (
	params: LNURLChannelParams,
): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		// TODO: Connect to peer from URI.
		const lnurlRes = await lnurlChannel({
			params,
			isPrivate: true,
			cancel: false,
			localNodeId: '',
		});

		if (lnurlRes.isErr()) {
			return resolve(err(lnurlRes.error));
		}

		resolve(ok(lnurlRes.value));
	});
};

/**
 * Creates and stores a lightning invoice, for the specified amount, and refreshes/re-adds peers.
 * @param {number} amountSats
 * @param {string} [description]
 * @param {number} [expiryDeltaSeconds]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
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
	if (!hasOpenLightningChannels({ selectedWallet, selectedNetwork })) {
		return err('No lightning channels available to receive an invoice.');
	}
	const invoice = await createPaymentRequest({
		amountSats,
		description,
		expiryDeltaSeconds,
	});
	if (invoice.isErr()) {
		return err(invoice.error.message);
	}

	addPeers().then();

	const payload = {
		invoice: invoice.value,
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.ADD_LIGHTNING_INVOICE,
		payload,
	});
	return ok(invoice.value);
};

/**
 * Filters out and removes expired invoices from the invoices array
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 * @returns {Promise<Result<string>>}
 */
export const removeExpiredLightningInvoices = async ({
	selectedNetwork,
	selectedWallet,
}: {
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.REMOVE_EXPIRED_LIGHTNING_INVOICES,
		payload,
	});
	return ok('');
};

/**
 * Removes a lightning invoice from the invoices array via its payment hash.
 * @param {string} paymentHash
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 * @returns {Promise<Result<string>>}
 */
export const removeLightningInvoice = async ({
	paymentHash,
	selectedNetwork,
	selectedWallet,
}: {
	paymentHash: string;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
}): Promise<Result<string>> => {
	if (!paymentHash) {
		return err('No payment hash provided.');
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const payload = {
		paymentHash,
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.REMOVE_LIGHTNING_INVOICE,
		payload,
	});
	return ok('Successfully removed lightning invoice.');
};

/**
 * Adds a paid lightning invoice to the payments object for future reference.
 * @param {TInvoice} invoice
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 * @returns {Result<string>}
 */
export const addLightningPayment = ({
	invoice,
	selectedNetwork,
	selectedWallet,
}: {
	invoice: TInvoice;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
}): Result<string> => {
	if (!invoice) {
		return err('No payment invoice provided.');
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	const lightningPayments =
		getStore().lightning.nodes[selectedWallet].payments[selectedNetwork];

	// It's possible ldk.pay returned true for an invoice we already paid.
	// Run another check here.
	if (invoice.payment_hash in lightningPayments) {
		return err('Lightning invoice has already been paid.');
	}
	const payload = {
		invoice,
		selectedWallet,
		selectedNetwork,
	};
	dispatch({
		type: actions.ADD_LIGHTNING_PAYMENT,
		payload,
	});
	removeLightningInvoice({
		paymentHash: invoice.payment_hash,
		selectedNetwork,
		selectedWallet,
	}).then();
	return ok('Successfully added lightning payment.');
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
