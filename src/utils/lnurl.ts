import {
	createChannelRequestUrl,
	createPayRequestUrl,
	createWithdrawCallbackUrl,
	lnurlAuth as lnAuth,
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLWithdrawParams,
} from '@synonymdev/react-native-lnurl';
import { err, ok, Result } from '@synonymdev/result';

import {
	showErrorNotification,
	showSuccessNotification,
} from './notifications';
import {
	addPeer,
	getLightningBalance,
	getNodeIdFromStorage,
	getPeersFromStorage,
} from './lightning';
import { createLightningInvoice, savePeer } from '../store/actions/lightning';
import { EQRDataType, processInputData, TProcessedData } from './scanner';
import { TWalletName } from '../store/types/wallet';
import { TAvailableNetworks } from './networks';
import {
	getMnemonicPhrase,
	getSelectedNetwork,
	getSelectedWallet,
} from './wallet';
import i18n from './i18n';

/**
 * Handles LNURL Pay Requests.
 * @param {LNURLPayParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<TProcessedData>>}
 */
export const handleLnurlPay = async ({
	params,
	selectedWallet,
	selectedNetwork,
}: {
	params: LNURLPayParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessedData>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const nodeId = getNodeIdFromStorage({ selectedWallet, selectedNetwork });
	if (!nodeId) {
		showErrorNotification({
			title: i18n.t('other:lnurl_ln_error_title'),
			message: i18n.t('other:lnurl_ln_error_msg'),
		});
		return err(
			'Unable to startup local lightning node at this time. Please try again or restart the app.',
		);
	}

	const milliSats = params.minSendable;

	const callbackRes = createPayRequestUrl({
		params,
		milliSats,
		comment: 'Bitkit LNURL-Pay',
	});
	if (callbackRes.isErr()) {
		showErrorNotification({
			title: i18n.t('other:lnurl_pay_error'),
			message: callbackRes.error.message,
		});
		return err(callbackRes.error.message);
	}

	const invoice = callbackRes.value;

	//Now that we have the invoice, process it.
	return await processInputData({
		data: invoice,
		selectedWallet,
		selectedNetwork,
	});
};

/**
 * Handles LNURL Channel Open Requests.
 * @param {LNURLChannelParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const handleLnurlChannel = async ({
	params,
	selectedWallet,
	selectedNetwork,
}: {
	params: LNURLChannelParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessedData>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const peer = params.uri;
	if (peer.includes('onion')) {
		showErrorNotification({
			title: i18n.t('other:lnurl_channel_error'),
			message: i18n.t('lightning:error_add_tor'),
		});
		return err('Unable to add tor nodes at this time.');
	}

	const nodeId = getNodeIdFromStorage({ selectedWallet, selectedNetwork });
	if (!nodeId) {
		showErrorNotification({
			title: i18n.t('other:lnurl_channel_error'),
			message: i18n.t('other:lnurl_ln_error_msg'),
		});
		return err(
			'Unable to startup local lightning node at this time. Please try again or restart the app.',
		);
	}
	const peers = getPeersFromStorage({ selectedWallet, selectedNetwork });

	// Add this peer if we haven't already.
	if (!peers.includes(peer)) {
		const addPeerRes = await addPeer({
			peer,
			timeout: 5000,
		});
		if (addPeerRes.isErr()) {
			showErrorNotification({
				title: i18n.t('other:lnurl_channel_error'),
				message:
					i18n.t('lightning:error_add') + '\n' + addPeerRes.error.message,
			});
			return err(addPeerRes.error.message);
		}
		const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
		if (savePeerRes.isErr()) {
			showErrorNotification({
				title: i18n.t('other:lnurl_channel_error'),
				message:
					i18n.t('lightning:error_save') + '\n' + savePeerRes.error.message,
			});
			return err(savePeerRes.error.message);
		}
	}

	const callbackRes = createChannelRequestUrl({
		localNodeId: nodeId,
		params,
		isPrivate: true,
		cancel: false,
	});
	if (callbackRes.isErr()) {
		showErrorNotification({
			title: i18n.t('other:lnurl_channel_error'),
			message: callbackRes.error.message,
		});
		return err(callbackRes.error.message);
	}

	const channelStatusRes = await fetch(callbackRes.value);
	if (channelStatusRes.status !== 200) {
		showErrorNotification({
			title: i18n.t('other:lnurl_channel_error'),
			message: i18n.t('other:lnurl_blocktank_error'),
		});
		return err('Unable to connect to Blocktank server.');
	}
	const jsonRes = await channelStatusRes.json();

	if (jsonRes.status === 'ERROR') {
		showErrorNotification({
			title: i18n.t('other:lnurl_channel_error'),
			message: jsonRes.reason,
		});
		return err(jsonRes.reason);
	}

	showSuccessNotification({
		title: i18n.t('other:lnurl_channel_success_title'),
		message: peer
			? i18n.t('other:lnurl_channel_success_msg_peer', { peer })
			: i18n.t('other:lnurl_channel_success_msg_no_peer'),
	});
	return ok({ type: EQRDataType.lnurlChannel });
};

/**
 * Handles LNURL Auth Requests.
 * @param {LNURLAuthParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<TProcessedData>>}
 */
export const handleLnurlAuth = async ({
	params,
	selectedWallet,
	selectedNetwork,
}: {
	params: LNURLAuthParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessedData>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const getMnemonicPhraseResponse = await getMnemonicPhrase(selectedWallet);
	if (getMnemonicPhraseResponse.isErr()) {
		return err(getMnemonicPhraseResponse.error.message);
	}

	const authRes = await lnAuth({
		params,
		// @ts-ignore
		network: selectedNetwork,
		bip32Mnemonic: getMnemonicPhraseResponse.value,
	});
	if (authRes.isErr()) {
		showErrorNotification({
			title: i18n.t('other:lnurl_auth_error'),
			message: authRes.error.message,
		});
		return err(authRes.error.message);
	}

	showSuccessNotification({
		title: i18n.t('other:lnurl_auth_success_title'),
		message: params.domain
			? i18n.t('other:lnurl_auth_success_msg_domain', { domain: params.domain })
			: i18n.t('other:lnurl_auth_success_msg_no_domain'),
	});
	return ok({ type: EQRDataType.lnurlAuth });
};

/**
 * Handles LNURL Withdraw Requests.
 * @param {LNURLWithdrawParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<TProcessedData>>}
 */
export const handleLnurlWithdraw = async ({
	params,
	selectedWallet,
	selectedNetwork,
}: {
	params: LNURLWithdrawParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessedData>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const amountSats = params.maxWithdrawable / 1000; //Convert msats to sats.
	const description = params?.defaultDescription ?? '';

	// Determine if we have enough receiving capacity before proceeding.
	const lightningBalance = await getLightningBalance({
		selectedWallet,
		selectedNetwork,
		includeReserveBalance: false,
	});

	if (lightningBalance.remoteBalance < amountSats) {
		showErrorNotification({
			title: i18n.t('other:lnurl_withdr_error'),
			message: i18n.t('other:lnurl_withdr_error_no_capacity'),
		});
		return err(
			'Not enough inbound/receiving capacity to complete lnurl-withdraw request.',
		);
	}

	const invoice = await createLightningInvoice({
		expiryDeltaSeconds: 3600,
		amountSats,
		description,
		selectedWallet,
		selectedNetwork,
	});
	if (invoice.isErr()) {
		showErrorNotification({
			title: i18n.t('other:lnurl_withdr_error'),
			message: i18n.t('other:lnurl_withdr_error_create_invoice'),
		});
		return err('Unable to successfully create invoice for lnurl-withdraw.');
	}
	const callbackRes = createWithdrawCallbackUrl({
		params,
		paymentRequest: invoice.value.to_str,
	});
	if (callbackRes.isErr()) {
		showErrorNotification({
			title: i18n.t('other:lnurl_withdr_error'),
			message: callbackRes.error.message,
		});
		return err(callbackRes.error.message);
	}

	const channelStatusRes = await fetch(callbackRes.value);
	if (channelStatusRes.status !== 200) {
		showErrorNotification({
			title: i18n.t('other:lnurl_withdr_error'),
			message: i18n.t('other:lnurl_withdr_error_connect'),
		});
		return err('Unable to connect to LNURL withdraw server.');
	}

	showSuccessNotification({
		title: i18n.t('other:lnurl_withdr_success_title'),
		message: i18n.t('other:lnurl_withdr_success_msg'),
	});
	return ok({ type: EQRDataType.lnurlWithdraw });
};
