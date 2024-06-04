import {
	createChannelRequestUrl,
	createWithdrawCallbackUrl,
	lnurlAuth as lnAuth,
	lnurlPay,
} from '@synonymdev/react-native-lnurl';
import {
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLWithdrawParams,
} from 'js-lnurl';
import { err, ok, Result } from '@synonymdev/result';

import { showToast } from './notifications';
import {
	addPeer,
	getNodeIdFromStorage,
	getPeersFromStorage,
} from './lightning';
import { createLightningInvoice, savePeer } from '../store/utils/lightning';
import { EQRDataType, TProcessedData } from './scanner';
import { TWalletName } from '../store/types/wallet';
import { EAvailableNetwork } from './networks';
import {
	getMnemonicPhrase,
	getSelectedNetwork,
	getSelectedWallet,
} from './wallet';
import i18n from './i18n';

/**
 * Finds an LNURL in a string.
 * @see https://github.com/lnurl/luds/blob/luds/01.md#fallback-scheme
 * @param {string} text
 * @returns {string | null}
 */
export const findlnurl = (text: string): string | null => {
	const text2 = text.toLowerCase().trim();
	const res =
		/^(?:(http.*|bitcoin:.*)[&?]lightning=|lightning:)?(lnurl1[02-9ac-hj-np-z]+)/.exec(
			text2,
		);
	return res ? res[2] : null;
};

/**
 * Checks if a string is a valid LN Address.
 * @param {string} address
 * @returns {boolean}
 */
export const isLnurlAddress = (address: string): boolean => {
	// ensure only 1 `@` present:
	const splitted = address.split('@');
	if (splitted.length !== 2) {
		return false;
	}
	return !!splitted[0].trim() && !!splitted[1].trim();
};

/**
 * Handles LNURL Pay Requests.
 * @param {LNURLPayParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const handleLnurlPay = async ({
	params,
	amountSats,
}: {
	params: LNURLPayParams;
	amountSats: number;
}): Promise<Result<string>> => {
	const nodeId = getNodeIdFromStorage();

	if (!nodeId) {
		const message = i18n.t('other:lnurl_ln_error_msg');
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_pay_error'),
			description: message,
		});
		return err(message);
	}

	const milliSats = Math.floor(amountSats * 1000);

	try {
		const callbackRes = await lnurlPay({
			params,
			milliSats,
			// comment should only be included if server asks for it with "commentAllowed"
			// https://github.com/lnurl/luds/blob/luds/12.md
			// comment: 'Bitkit LNURL-Pay',
			comment: '',
		});

		if (callbackRes.isErr()) {
			showToast({
				type: 'warning',
				title: i18n.t('other:lnurl_pay_error'),
				description: `An error occurred: ${callbackRes.error.message}`,
			});
			return err(callbackRes.error.message);
		}

		return ok(callbackRes.value.pr);
	} catch (e) {
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_pay_error'),
			description: `An error occurred: ${e.message}`,
		});
		return err(e.message);
	}
};

/**
 * Handles LNURL Channel Open Requests.
 * @param {LNURLChannelParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const handleLnurlChannel = async ({
	params,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	params: LNURLChannelParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TProcessedData>> => {
	const peer = params.uri;
	if (peer.includes('onion')) {
		const message = i18n.t('lightning:error_add_tor');
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_channel_error'),
			description: message,
		});
		return err(message);
	}

	const nodeId = getNodeIdFromStorage();
	if (!nodeId) {
		const message = i18n.t('other:lnurl_ln_error_msg');
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_channel_error'),
			description: message,
		});
		return err(message);
	}
	const peers = getPeersFromStorage({ selectedWallet, selectedNetwork });

	// Add this peer if we haven't already.
	if (!peers.includes(peer)) {
		const addPeerRes = await addPeer({
			peer,
			timeout: 5000,
		});
		if (addPeerRes.isErr()) {
			console.log(addPeerRes.error.message);
			showToast({
				type: 'warning',
				title: i18n.t('other:lnurl_channel_error'),
				description: i18n.t('lightning:error_add'),
			});
			return err(addPeerRes.error.message);
		}
		const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
		if (savePeerRes.isErr()) {
			console.log(savePeerRes.error.message);
			showToast({
				type: 'warning',
				title: i18n.t('other:lnurl_channel_error'),
				description: i18n.t('lightning:error_save'),
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
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_channel_error'),
			description: i18n.t('other:lnurl_channel_error', {
				raw: callbackRes.error.message,
			}),
		});
		return err(callbackRes.error.message);
	}

	const channelStatusRes = await fetch(callbackRes.value);
	if (channelStatusRes.status !== 200) {
		const message = i18n.t('other:lnurl_blocktank_error');
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_channel_error'),
			description: message,
		});
		return err(message);
	}
	const jsonRes = await channelStatusRes.json();

	if (jsonRes.status === 'ERROR') {
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_channel_error'),
			description: `An error occurred: ${jsonRes.reason}`,
		});
		return err(jsonRes.reason);
	}

	showToast({
		type: 'success',
		title: i18n.t('other:lnurl_channel_success_title'),
		description: peer
			? i18n.t('other:lnurl_channel_success_msg_peer', { peer })
			: i18n.t('other:lnurl_channel_success_msg_no_peer'),
	});
	return ok({ type: EQRDataType.lnurlChannel });
};

/**
 * Handles LNURL Auth Requests.
 * @param {LNURLAuthParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TProcessedData>>}
 */
export const handleLnurlAuth = async ({
	params,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	params: LNURLAuthParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TProcessedData>> => {
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
		console.log(authRes.error.message);
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_auth_error'),
			description: i18n.t('other:lnurl_auth_error_msg', {
				raw: authRes.error.message,
			}),
		});
		return err(authRes.error.message);
	}

	showToast({
		type: 'success',
		title: i18n.t('other:lnurl_auth_success_title'),
		description: params.domain
			? i18n.t('other:lnurl_auth_success_msg_domain', { domain: params.domain })
			: i18n.t('other:lnurl_auth_success_msg_no_domain'),
	});
	return ok({ type: EQRDataType.lnurlAuth });
};

/**
 * Handles LNURL Withdraw Requests.
 * @param {number} amount
 * @param {LNURLWithdrawParams} params
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TProcessedData>>}
 */
export const handleLnurlWithdraw = async ({
	amount,
	params,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	amount: number;
	params: LNURLWithdrawParams;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TProcessedData>> => {
	const invoice = await createLightningInvoice({
		expiryDeltaSeconds: 3600,
		amountSats: amount,
		description: params.defaultDescription ?? '',
		selectedWallet,
		selectedNetwork,
	});
	if (invoice.isErr()) {
		const message = i18n.t('other:lnurl_withdr_error_create_invoice');
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_withdr_error'),
			description: message,
		});
		return err(message);
	}
	const callbackRes = createWithdrawCallbackUrl({
		params,
		paymentRequest: invoice.value.to_str,
	});
	if (callbackRes.isErr()) {
		console.log(callbackRes.error.message);
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_withdr_error'),
			description: i18n.t('other:lnurl_withdr_error_generic'),
		});
		return err(callbackRes.error.message);
	}

	try {
		const channelStatusRes = await fetch(callbackRes.value);
		const jsonRes = await channelStatusRes.json();

		if (jsonRes.status === 'ERROR') {
			console.log(jsonRes.reason);
			showToast({
				type: 'warning',
				title: i18n.t('other:lnurl_withdr_error'),
				description: i18n.t('other:lnurl_withdr_error_generic'),
			});
			return err(jsonRes.reason);
		}

		showToast({
			type: 'success',
			title: i18n.t('other:lnurl_withdr_success_title'),
			description: i18n.t('other:lnurl_withdr_success_msg'),
		});

		return ok({ type: EQRDataType.lnurlWithdraw });
	} catch (e) {
		console.log(e.message);
		showToast({
			type: 'warning',
			title: i18n.t('other:lnurl_withdr_error'),
			description: i18n.t('other:lnurl_withdr_error_generic'),
		});
		return err(e.message);
	}
};
