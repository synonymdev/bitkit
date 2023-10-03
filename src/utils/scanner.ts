/**
 * Helper functions that allow for any possible bitcoin related QR to be scanned
 */

import bip21 from 'bip21';
import { address as bitcoinJSAddress } from 'bitcoinjs-lib';
import { err, ok, Result } from '@synonymdev/result';
import SDK from '@synonymdev/slashtags-sdk';
import { TInvoice } from '@synonymdev/react-native-ldk';
import { getLNURLParams } from '@synonymdev/react-native-lnurl';
import { bech32m } from 'bech32';
import URLParse from 'url-parse';
import {
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLWithdrawParams,
} from 'js-lnurl';

import {
	getOnchainTransactionData,
	getTransactionInputValue,
	parseOnChainPaymentRequest,
} from './wallet/transactions';
import { getLightningStore } from '../store/helpers';
import { showToast, ToastOptions } from './notifications';
import { updateSendTransaction } from '../store/actions/wallet';
import { getBalance, getSelectedNetwork, getSelectedWallet } from './wallet';
import { showBottomSheet, closeBottomSheet } from '../store/actions/ui';
import { handleSlashtagURL } from './slashtags';
import { getSlashPayConfig2 } from './slashtags2';
import {
	addPeer,
	decodeLightningInvoice,
	getLightningBalance,
} from './lightning';
import {
	availableNetworks,
	EAvailableNetworks,
	networks,
	TAvailableNetworks,
} from './networks';
import { setFeedWidget } from '../store/actions/widgets';
import { savePeer } from '../store/actions/lightning';
import { TWalletName } from '../store/types/wallet';
import { sendNavigation } from '../navigation/bottom-sheet/SendNavigation';
import { rootNavigation } from '../navigation/root/RootNavigator';
import { LuganoFeedURL } from '../screens/Widgets/WidgetsSuggestions';
import { SUPPORTED_FEED_TYPES } from './widgets';
import { handleLnurlAuth } from './lnurl';
import i18n from './i18n';

const availableNetworksList = availableNetworks();

export enum EQRDataType {
	bitcoinAddress = 'bitcoinAddress',
	lightningPaymentRequest = 'lightningPaymentRequest',
	lnurlPay = 'lnurlPay',
	lnurlChannel = 'lnurlChannel',
	lnurlAuth = 'lnurlAuth',
	lnurlWithdraw = 'lnurlWithdraw',
	slashAuthURL = 'slashAuthURL',
	slashtagURL = 'slashURL',
	slashFeedURL = 'slashFeedURL',
	nodeId = 'nodeId',
	treasureHunt = 'treasureHunt',
	//TODO add xpub, lightning node peer etc
}

export type TLnUrlData =
	| TLnUrlAuth
	| TLnUrlChannel
	| TLnUrlPay
	| TLnUrlWithdraw;

export type QRData =
	| TBitcoinUrl
	| TLightningUrl
	| TLnUrlData
	| TNodeId
	| TSlashTagUrl
	| TSlashAuthUrl
	| TSlashFeedUrl
	| TTreasureChestUrl;

export type TBitcoinUrl = {
	qrDataType: EQRDataType.bitcoinAddress;
	address: string;
	sats: number;
	network?: TAvailableNetworks | EAvailableNetworks;
	message?: string;
	slashTagsUrl?: string;
};
export type TLightningUrl = {
	qrDataType: EQRDataType.lightningPaymentRequest;
	lightningPaymentRequest: string;
	sats?: number;
	network?: TAvailableNetworks;
	message?: string;
	slashTagsUrl?: string;
};
export type TLnUrlAuth = {
	qrDataType: EQRDataType.lnurlAuth;
	lnUrlParams: LNURLAuthParams;
};
export type TLnUrlChannel = {
	qrDataType: EQRDataType.lnurlChannel;
	lnUrlParams: LNURLChannelParams;
	network?: TAvailableNetworks;
};
export type TLnUrlPay = {
	qrDataType: EQRDataType.lnurlPay;
	lnUrlParams: LNURLPayParams;
	network?: TAvailableNetworks;
};
export type TLnUrlWithdraw = {
	qrDataType: EQRDataType.lnurlWithdraw;
	lnUrlParams: LNURLWithdrawParams;
	network?: TAvailableNetworks;
};
export type TNodeId = {
	qrDataType: EQRDataType.nodeId;
	network: TAvailableNetworks;
	url: string;
};
export type TSlashTagUrl = {
	qrDataType: EQRDataType.slashtagURL;
	url: string;
};
export type TSlashAuthUrl = {
	qrDataType: EQRDataType.slashAuthURL;
	url: string;
};
export type TSlashFeedUrl = {
	qrDataType: EQRDataType.slashFeedURL;
	url: string;
};
export type TTreasureChestUrl = {
	qrDataType: EQRDataType.treasureHunt;
	chestId: string;
};

export const validateAddress = ({
	address,
	selectedNetwork,
}: {
	address: string;
	selectedNetwork?: EAvailableNetworks;
}): {
	isValid: boolean;
	network: EAvailableNetworks;
} => {
	try {
		//Validate address for all available networks
		let isValid = false;
		let network: EAvailableNetworks = EAvailableNetworks.bitcoin;

		//Validate address for a specific network
		if (selectedNetwork !== undefined) {
			try {
				bitcoinJSAddress.toOutputScript(address, networks[selectedNetwork]);
				return { isValid: true, network: selectedNetwork };
			} catch {
				// In the event the normal check fails, determine if this is a taproot address.
				const taprootRes = isValidBech32mEncodedString(address);
				if (taprootRes.isValid && taprootRes.network === selectedNetwork) {
					return { isValid: taprootRes.isValid, network: taprootRes.network };
				}
			}
			return { isValid: false, network: selectedNetwork };
		}

		for (let i = 0; i < availableNetworksList.length; i++) {
			const validateRes = validateAddress({
				address,
				selectedNetwork: availableNetworksList[i],
			});
			if (validateRes.isValid) {
				isValid = validateRes.isValid;
				network = validateRes.network;
				break;
			}
		}
		return { isValid, network };
	} catch (e) {
		return { isValid: false, network: EAvailableNetworks.bitcoin };
	}
};

/**
 * Returns if the provided string is a valid Bech32m encoded string (taproot/p2tr address).
 * @param {string} address
 * @returns { isValid: boolean; network: EAvailableNetworks }
 */
export const isValidBech32mEncodedString = (
	address: string,
): { isValid: boolean; network: EAvailableNetworks } => {
	try {
		const decoded = bech32m.decode(address);
		if (decoded.prefix === 'bc') {
			return { isValid: true, network: EAvailableNetworks.bitcoin };
		} else if (decoded.prefix === 'tb') {
			return { isValid: true, network: EAvailableNetworks.bitcoinTestnet };
		} else if (decoded.prefix === 'bcrt') {
			return { isValid: true, network: EAvailableNetworks.bitcoinRegtest };
		}
	} catch (error) {
		return { isValid: false, network: EAvailableNetworks.bitcoin };
	}
	return { isValid: false, network: EAvailableNetworks.bitcoin };
};

export type TProcessedData = {
	type: EQRDataType;
	address?: string;
	amount?: number;
};

/**
 * This method processes, decodes and handles all scanned/pasted information provided by the user.
 * @param {string} data
 * @param {'mainScanner' | 'send'} [source]
 * @param {SDK} sdk
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @param {Array} [skip]
 */
export const processInputData = async ({
	data,
	source = 'mainScanner',
	sdk,
	selectedNetwork,
	selectedWallet,
	skip = [],
	showErrors = true,
}: {
	data: string;
	source?: 'mainScanner' | 'send';
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	sdk?: SDK;
	skip?: Array<string>;
	showErrors?: boolean;
}): Promise<Result<TProcessedData>> => {
	data = data.trim();
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		const decodeRes = await decodeQRData(data, selectedNetwork);
		if (decodeRes.isErr()) {
			const errorMessage = i18n.t('other:scan_err_interpret_msg');
			if (showErrors) {
				showToast({
					type: 'error',
					title: i18n.t('other:scan_err_decoding'),
					description: errorMessage,
				});
			}
			return err(errorMessage);
		}

		// Unable to interpret any of the provided data.
		if (!decodeRes.value.length) {
			const errorMessage = i18n.t('other:scan_err_interpret_msg');
			if (showErrors) {
				showToast({
					type: 'error',
					title: i18n.t('other:scan_err_interpret_title'),
					description: errorMessage,
				});
			}
			return err(errorMessage);
		}

		let dataToHandle;

		// Check if we're dealing with a Bitcoin payment request.
		if (
			decodeRes.value.length > 1 ||
			decodeRes.value[0].qrDataType === 'bitcoinAddress' ||
			decodeRes.value[0].qrDataType === 'lightningPaymentRequest'
		) {
			// Attempt to handle a unified Bitcoin transaction.
			const processBitcoinTxResponse = await processBitcoinTransactionData({
				data: decodeRes.value,
				selectedWallet,
				selectedNetwork,
			});
			if (processBitcoinTxResponse.isErr()) {
				return err(processBitcoinTxResponse.error.message);
			}
			dataToHandle = processBitcoinTxResponse.value;
		} else if (
			source === 'send' &&
			decodeRes.value[0].qrDataType === 'slashURL'
		) {
			if (!sdk) {
				const msg =
					'Slashtags SDK was not provided to processInputData method.';
				console.log(msg);
				return err(msg);
			}

			// Check if this is a slashtag url, and we want to send funds to it.
			const url = decodeRes.value[0].url ?? '';
			const response = await processSlashPayURL({ url });

			if (response.isErr()) {
				if (showErrors) {
					showToast({
						type: 'error',
						title: i18n.t('slashtags:error_pay_title'),
						description: `An error occurred: ${response.error.message}`,
					});
				}
				return err(response.error.message);
			}

			if (response.value.length === 0) {
				const errorMessage = i18n.t('slashtags:error_pay_empty_msg');
				if (showErrors) {
					showToast({
						type: 'error',
						title: i18n.t('slashtags:error_pay_title'),
						description: errorMessage,
					});
				}
				return err(errorMessage);
			}

			const filteredData = response.value.filter(
				({ qrDataType }) => !skip.includes(qrDataType),
			);

			// The first item in the array is the preferred payment method.
			const receivePreference = filteredData[0].qrDataType;

			const processBitcoinTxResponse = await processBitcoinTransactionData({
				data: filteredData,
				preferredPaymentMethod: receivePreference,
				selectedWallet,
				selectedNetwork,
			});
			if (processBitcoinTxResponse.isErr()) {
				return err(processBitcoinTxResponse.error.message);
			}
			dataToHandle = processBitcoinTxResponse.value;
		} else if (decodeRes.value[0].qrDataType === 'slashAuthURL') {
			dataToHandle = decodeRes.value[0];
		} else if (decodeRes.value[0].qrDataType === 'slashFeedURL') {
			dataToHandle = decodeRes.value[0];
		} else {
			dataToHandle = decodeRes.value[0];
		}

		return await handleData({
			data: dataToHandle,
			selectedNetwork,
			selectedWallet,
		});
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Return all networks and their payment request details if found in QR data.
 * Can also be used to read clipboard data for any addresses or payment requests.
 * @param data
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {string}
 */
export const decodeQRData = async (
	data: string,
	selectedNetwork?: TAvailableNetworks,
): Promise<Result<QRData[]>> => {
	if (!data) {
		return err('No data provided.');
	}

	// Treasure hunt
	if (__DEV__ || selectedNetwork === EAvailableNetworks.bitcoin) {
		// Airdrop
		if (data.includes('bitkit.to/drone')) {
			const chestId = '2gZxrqhc';
			return ok([{ qrDataType: EQRDataType.treasureHunt, chestId }]);
		}
		// Universal links
		if (data.includes('bitkit.to/treasure-hunt')) {
			const url = new URLParse(data, true);
			const chestId = url.query.chest!;

			if (chestId) {
				setTimeout(() => {
					setFeedWidget({
						url: LuganoFeedURL,
						type: SUPPORTED_FEED_TYPES.LUGANO_FEED,
						fields: [],
					});
				}, 1000);

				return ok([{ qrDataType: EQRDataType.treasureHunt, chestId }]);
			}
		}
		// Deeplinks (fallback)
		if (data.includes('bitkit:chest')) {
			const chestId = data.split('-')[1];

			if (chestId) {
				setTimeout(() => {
					setFeedWidget({
						url: LuganoFeedURL,
						type: SUPPORTED_FEED_TYPES.LUGANO_FEED,
						fields: [],
					});
				}, 1000);

				return ok([{ qrDataType: EQRDataType.treasureHunt, chestId }]);
			}
		}
	}

	// Slashtags
	if (data.startsWith('slashauth:')) {
		return ok([{ qrDataType: EQRDataType.slashAuthURL, url: data }]);
	} else if (data.startsWith('slash:')) {
		return ok([{ qrDataType: EQRDataType.slashtagURL, url: data }]);
	} else if (data.startsWith('slashfeed:')) {
		return ok([{ qrDataType: EQRDataType.slashFeedURL, url: data }]);
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	let foundNetworksInQR: (
		| TBitcoinUrl
		| TLightningUrl
		| TLnUrlData
		| TNodeId
	)[] = [];
	let lightningInvoice = '';
	let error = '';

	//Lightning URI or plain lightning payment request
	if (
		data.toLowerCase().indexOf('lightning:') > -1 ||
		data.toLowerCase().startsWith('lntb') ||
		data.toLowerCase().startsWith('lnbc') ||
		data.toLowerCase().startsWith('lnurl')
	) {
		//If it's a lightning URI, remove "lightning:", everything to the left of it.
		let invoice = data
			.replace(/^.*?(lightning:)/i, '')
			.trim()
			.toLowerCase();
		//Attempt to handle any lnurl request.
		if (invoice.startsWith('lnurl')) {
			const res = await getLNURLParams(invoice);
			if (res.isOk()) {
				const params = res.value;

				if ('tag' in params) {
					if (params.tag === 'login') {
						foundNetworksInQR.push({
							qrDataType: EQRDataType.lnurlAuth,
							lnUrlParams: params as LNURLAuthParams,
						});
					}
					if (params.tag === 'withdrawRequest') {
						foundNetworksInQR.push({
							qrDataType: EQRDataType.lnurlWithdraw,
							//No real difference between networks for lnurl, all keys are derived the same way so assuming current network
							network: selectedNetwork,
							lnUrlParams: params as LNURLWithdrawParams,
						});
					}
					if (params.tag === 'channelRequest') {
						foundNetworksInQR.push({
							qrDataType: EQRDataType.lnurlChannel,
							//No real difference between networks for lnurl, all keys are derived the same way so assuming current network
							network: selectedNetwork,
							lnUrlParams: params as LNURLChannelParams,
						});
					}
					if (params.tag === 'payRequest') {
						foundNetworksInQR.push({
							qrDataType: EQRDataType.lnurlPay,
							//No real difference between networks for lnurl, all keys are derived the same way so assuming current network
							network: selectedNetwork,
							lnUrlParams: params as LNURLPayParams,
						});
					}
				}
			} else {
				error += `${res.error.message} `;
			}
		} else {
			//Assume invoice
			//Ignore params if there are any, all details can be derived from invoice
			if (invoice.indexOf('?') > -1) {
				invoice = invoice.split('?')[0];
			}
			lightningInvoice = invoice;
		}
	}

	//Plain bitcoin address or Bitcoin address URI
	try {
		//Validate address for selected network
		const onChainParseResponse = parseOnChainPaymentRequest(
			data,
			selectedNetwork,
		);
		if (onChainParseResponse.isOk()) {
			const { address, sats, message, network } = onChainParseResponse.value;
			foundNetworksInQR.push({
				qrDataType: EQRDataType.bitcoinAddress,
				address,
				network,
				sats,
				message,
			});
		} else {
			error += `${onChainParseResponse.error.message} `;
		}

		// types are wrong for package 'bip21'
		const { options } = bip21.decode(data) as {
			address: string;
			options: { [key: string]: string };
		};

		//If a lightning invoice was passed as a param
		if (options.lightning) {
			const decodedInvoice = await decodeLightningInvoice({
				paymentRequest: options.lightning,
			});
			if (decodedInvoice.isOk()) {
				foundNetworksInQR.push({
					qrDataType: EQRDataType.lightningPaymentRequest,
					lightningPaymentRequest: options.lightning,
					network: selectedNetwork,
					sats: decodedInvoice.value?.amount_satoshis ?? 0,
					message: decodedInvoice.value?.description ?? '',
				});
				lightningInvoice = options.lightning;
			} else {
				error += `${decodedInvoice.error.message} `;
			}
		}
	} catch (e) {}

	if (lightningInvoice) {
		const decodedInvoice = await decodeLightningInvoice({
			paymentRequest: lightningInvoice,
		});
		// TODO: show something when LN invoice is expired?
		if (decodedInvoice.isOk()) {
			foundNetworksInQR.push({
				qrDataType: EQRDataType.lightningPaymentRequest,
				lightningPaymentRequest: data,
				network: selectedNetwork,
				sats: decodedInvoice.value.amount_satoshis ?? 0,
				message: decodedInvoice.value.description ?? '',
			});
		} else {
			error += `${decodedInvoice.error.message} `;
		}
	}

	if (!foundNetworksInQR.length) {
		// Attempt to determine if it's a node id to connect with and add.
		const dataSplit = data.split(':');
		if (dataSplit.length === 2 && dataSplit[0].includes('@')) {
			foundNetworksInQR.push({
				qrDataType: EQRDataType.nodeId,
				url: data,
				network: selectedNetwork,
			});
		}
	}

	if (foundNetworksInQR.length) {
		return ok(foundNetworksInQR);
	}
	if (error) {
		return err(error);
	}
	return err('Bitkit is unable to read the provided data.');
};

export const processSlashPayURL = async ({
	url,
}: {
	url: string;
}): Promise<Result<QRData[]>> => {
	try {
		const payConfig = await getSlashPayConfig2(url);
		const qrData: QRData[] = [];

		payConfig.forEach(({ type, value }) => {
			switch (type) {
				case 'p2wpkh':
				case 'p2sh':
				case 'p2pkh':
					if (validateAddress({ address: value }).isValid) {
						qrData.push({
							qrDataType: EQRDataType.bitcoinAddress,
							address: value,
							sats: 0,
							slashTagsUrl: url,
						});
					}
					break;
				case 'lightningInvoice':
					qrData.push({
						qrDataType: EQRDataType.lightningPaymentRequest,
						lightningPaymentRequest: value,
						slashTagsUrl: url,
					});
			}
		});

		return ok(qrData);
	} catch (e) {
		console.log('processSlashPayURL error', e);
		return err(e);
	}
};

/**
 * This method will ensure the app is able to pay a given invoice amount for lightning and/or on-chain invoices.
 * If unable to pay the provided lightning invoice it will defer to on-chain.
 * If unable to pay the requested on-chain amount it will return only the on-chain address and set sats to zero.
 * @param {QRData[]} data
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const processBitcoinTransactionData = async ({
	data = [],
	preferredPaymentMethod,
	selectedNetwork,
	selectedWallet,
}: {
	data: QRData[];
	preferredPaymentMethod?: EQRDataType;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<QRData>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		let response;
		let error: ToastOptions | undefined; //Information that will be passed as a notification.
		let requestedAmount = 0; //Amount requested in sats by the provided invoice.

		let { onchainBalance, spendingBalance } = getBalance({
			selectedWallet,
			selectedNetwork,
		});
		const transaction = getOnchainTransactionData({
			selectedWallet,
			selectedNetwork,
		});
		if (transaction.isErr()) {
			return err(transaction.error.message);
		}
		const inputValue = getTransactionInputValue({
			selectedWallet,
			selectedNetwork,
			inputs: transaction.value.inputs,
		});
		// In the event we have preset inputs from address viewer.
		if (inputValue > onchainBalance) {
			onchainBalance = inputValue;
		}
		const openLightningChannels =
			getLightningStore().nodes[selectedWallet].openChannelIds[selectedNetwork];

		// Filter for the lightning invoice.
		const filteredLightningInvoice = data.find(
			(d) => d.qrDataType === EQRDataType.lightningPaymentRequest,
		) as TLightningUrl;
		let decodedLightningInvoice: TInvoice | undefined;
		if (filteredLightningInvoice) {
			const decodeInvoiceRes = await decodeLightningInvoice({
				paymentRequest: filteredLightningInvoice.lightningPaymentRequest ?? '',
			});
			if (decodeInvoiceRes.isOk()) {
				decodedLightningInvoice = decodeInvoiceRes.value;
				requestedAmount = decodedLightningInvoice.amount_satoshis ?? 0;
				if (decodedLightningInvoice.is_expired) {
					error = {
						type: 'error',
						title: 'Lightning Invoice Expired',
						description: 'This Lightning invoice has expired.',
					};
				}
			}
		}

		// Attempt to pay with lightning first.
		// 1. Check we have a lightning invoice
		// 2. Ensure the invoice has not expired.
		// 3. Ensure we have some open channels.
		// 4. Ensure we have a lightning balance.
		if (
			decodedLightningInvoice &&
			!decodedLightningInvoice.is_expired &&
			openLightningChannels.length &&
			spendingBalance
		) {
			// Ensure we can afford to pay the lightning invoice. If so, pass it through.
			if (spendingBalance >= requestedAmount) {
				response = filteredLightningInvoice;
			} else {
				const diff = requestedAmount - spendingBalance;
				error = {
					type: 'error',
					title: i18n.t('other:scan_pay_error_title'),
					description: `${diff} more sats needed to pay this invoice.`,
				};
			}
		}

		// If no lightning invoice response or the contact prefers on-chain payments, grab an on-chain invoice..
		if (!response || preferredPaymentMethod === EQRDataType.bitcoinAddress) {
			// Filter for the bitcoin address or on-chain invoice
			const bitcoinInvoice = data.find(
				(d) => d.qrDataType === EQRDataType.bitcoinAddress,
			) as TBitcoinUrl;
			if (bitcoinInvoice?.sats) {
				requestedAmount = bitcoinInvoice.sats;
			}

			// Attempt to pay the on-chain invoice if unable to pay with lightning.
			// Check that we have a bitcoin invoice and can afford to pay it.
			if (onchainBalance && bitcoinInvoice?.sats !== undefined) {
				// If we can afford to pay it, pass it through.
				// Otherwise, set the provided address and set sats to 0.
				if (onchainBalance > requestedAmount) {
					response = bitcoinInvoice;
				} else {
					showToast({
						type: 'error',
						title: i18n.t('other:scan_pay_error_title'),
						description: i18n.t('lightning:error_fulfill_msg', {
							amount: requestedAmount - onchainBalance,
						}),
					});

					// If the user already specified an amount in the app, don't override it.
					// Otherwise, set sats to 0.
					let sats = 0;
					if (transaction.value.outputs) {
						sats = transaction.value.outputs[0]?.value ?? 0;
					}
					response = {
						...bitcoinInvoice,
						sats,
					};
				}
			}
		}

		if (response) {
			return ok(response);
		}

		if (error) {
			showToast(error);
		} else {
			if (requestedAmount) {
				error = {
					type: 'error',
					title: i18n.t('other:scan_pay_error_title'),
					description: i18n.t('other:scan_pay_error_amount_description', {
						amount: requestedAmount,
					}),
				};
			} else {
				error = {
					type: 'error',
					title: i18n.t('other:scan_pay_error_title'),
					description: i18n.t('other:scan_pay_error_description'),
				};
			}
			showToast(error);
		}
		return err(error.title);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * This method will handle all actions required for each valid EQRDataType passed as data.
 * @param {QRData} data
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const handleData = async ({
	data,
	selectedWallet,
	selectedNetwork,
}: {
	data: QRData;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<TProcessedData>> => {
	if (!data) {
		showToast({
			type: 'error',
			title: i18n.t('other:qr_error_no_data_header'),
			description: i18n.t('other:qr_error_no_data_text'),
		});
		return err('Unable to read or interpret the provided data.');
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	const qrDataType = data.qrDataType;

	if (
		qrDataType === EQRDataType.bitcoinAddress &&
		data.network &&
		data.network !== selectedNetwork
	) {
		showToast({
			type: 'error',
			title: i18n.t('other:qr_error_network_header'),
			description: i18n.t('other:qr_error_network_text', {
				selectedNetwork,
				dataNetwork: data.network,
			}),
		});
		return err(
			`Bitkit is currently set to ${selectedNetwork} but data is for ${data.network}.`,
		);
	}

	//TODO(slashtags): Register Bitkit to handle all slash?x:// protocols
	switch (qrDataType) {
		case EQRDataType.slashtagURL: {
			handleSlashtagURL(data.url);
			closeBottomSheet('addContactModal');
			return ok({ type: EQRDataType.slashtagURL });
		}
		case EQRDataType.slashFeedURL: {
			handleSlashtagURL(data.url);
			return ok({ type: EQRDataType.slashFeedURL });
		}
		case EQRDataType.slashAuthURL: {
			showBottomSheet('slashauthModal', { url: data.url });
			return ok({ type: EQRDataType.slashAuthURL });
		}
		case EQRDataType.bitcoinAddress: {
			const { address, sats, message, slashTagsUrl } = data;

			// If BottomSheet is not open yet (MainScanner)
			showBottomSheet('sendNavigation', { screen: 'Amount' });

			// If BottomSheet is already open (SendScanner)
			sendNavigation.navigate('Amount');

			updateSendTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					label: message,
					outputs: [{ address: address, value: sats, index: 0 }],
					lightningInvoice: undefined,
					slashTagsUrl: slashTagsUrl,
				},
			});

			return ok({
				type: EQRDataType.bitcoinAddress,
				address: address,
				amount: sats,
			});
		}

		case EQRDataType.lightningPaymentRequest: {
			const { lightningPaymentRequest, slashTagsUrl } = data;

			const decodedInvoice = await decodeLightningInvoice({
				paymentRequest: lightningPaymentRequest,
			});
			if (decodedInvoice.isErr()) {
				console.log(decodedInvoice.error.message);
				showToast({
					type: 'error',
					title: i18n.t('lightning:error_decode'),
					description: i18n.t('other:qr_error_no_data_text'),
				});
				return err(decodedInvoice.error.message);
			}

			const invoiceAmount = decodedInvoice.value.amount_satoshis ?? 0;

			if (invoiceAmount) {
				showBottomSheet('sendNavigation', { screen: 'ReviewAndSend' });
				sendNavigation.navigate('ReviewAndSend');
			} else {
				showBottomSheet('sendNavigation', { screen: 'Amount' });
				sendNavigation.navigate('Amount');
			}

			updateSendTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					outputs: [
						{
							address: '',
							value: invoiceAmount,
							index: 0,
						},
					],
					lightningInvoice: lightningPaymentRequest,
					slashTagsUrl,
				},
			});

			return ok({
				type: EQRDataType.lightningPaymentRequest,
				amount: invoiceAmount,
			});
		}

		case EQRDataType.lnurlPay: {
			const params = data.lnUrlParams! as LNURLPayParams;

			//Convert msats to sats.
			params.minSendable = Math.floor(params.minSendable / 1000);
			params.maxSendable = Math.floor(params.maxSendable / 1000);

			// Determine if we have enough sending capacity before proceeding.
			const lightningBalance = getLightningBalance({
				selectedWallet,
				selectedNetwork,
				includeReserveBalance: false,
			});

			if (lightningBalance.localBalance < params.minSendable) {
				showToast({
					type: 'error',
					title: i18n.t('other:lnurl_pay_error'),
					description: i18n.t('other:lnurl_pay_error_no_capacity'),
				});
				return err(
					'Not enough outbound/sending capacity to complete lnurl-pay request.',
				);
			}

			showBottomSheet('lnurlPay', { pParams: params });
			return ok({ type: EQRDataType.lnurlPay });
		}
		case EQRDataType.lnurlChannel: {
			const params = data.lnUrlParams! as LNURLChannelParams;
			rootNavigation.navigate('LightningRoot', {
				screen: 'LNURLChannel',
				params: { cParams: params },
			});
			return ok({ type: EQRDataType.lnurlChannel });
		}
		case EQRDataType.lnurlAuth: {
			const params = data.lnUrlParams as LNURLAuthParams;
			return await handleLnurlAuth({ params, selectedWallet, selectedNetwork });
		}
		case EQRDataType.lnurlWithdraw: {
			let params = data.lnUrlParams as LNURLWithdrawParams;

			//Convert msats to sats.
			params.minWithdrawable = Math.floor(params.minWithdrawable / 1000);
			params.maxWithdrawable = Math.floor(params.maxWithdrawable / 1000);

			if (params.minWithdrawable > params.maxWithdrawable) {
				showToast({
					type: 'error',
					title: i18n.t('other:lnurl_withdr_error'),
					description: i18n.t('other:lnurl_withdr_error_minmax'),
				});
				return err(
					'Wrong lnurl-withdraw params: minWithdrawable > maxWithdrawable.',
				);
			}

			// Determine if we have enough receiving capacity before proceeding.
			const lightningBalance = getLightningBalance({
				selectedWallet,
				selectedNetwork,
				includeReserveBalance: false,
			});

			if (lightningBalance.remoteBalance < params.minWithdrawable) {
				showToast({
					type: 'error',
					title: i18n.t('other:lnurl_withdr_error'),
					description: i18n.t('other:lnurl_withdr_error_no_capacity'),
				});
				return err(
					'Not enough inbound/receiving capacity to complete lnurl-withdraw request.',
				);
			}

			showBottomSheet('lnurlWithdraw', { wParams: params });
			return ok({ type: EQRDataType.lnurlWithdraw });
		}

		case EQRDataType.nodeId: {
			const peer = data?.url;
			if (!peer) {
				return err('Unable to interpret peer information.');
			}
			if (peer.includes('onion')) {
				showToast({
					type: 'error',
					title: i18n.t('lightning:error_add_title'),
					description: i18n.t('lightning:error_add_tor'),
				});
				return err('Unable to add tor nodes at this time.');
			}
			const addPeerRes = await addPeer({
				peer,
				timeout: 5000,
			});
			if (addPeerRes.isErr()) {
				showToast({
					type: 'error',
					title: i18n.t('lightning:error_add'),
					description: addPeerRes.error.message,
				});
				return err('Unable to add lightning peer.');
			}
			const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
			if (savePeerRes.isErr()) {
				showToast({
					type: 'error',
					title: i18n.t('lightning:error_save_title'),
					description: savePeerRes.error.message,
				});
				return err(savePeerRes.error.message);
			}
			closeBottomSheet('sendNavigation');
			showToast({
				type: 'success',
				title: savePeerRes.value,
				description: i18n.t('lightning:peer_saved'),
			});
			return ok({ type: EQRDataType.nodeId });
		}

		case EQRDataType.treasureHunt: {
			showBottomSheet('treasureHunt', { chestId: data.chestId });
			return ok({ type: EQRDataType.lnurlWithdraw });
		}

		default:
			return err('Unable to read or interpret the provided data.');
	}
};

/**
 * This method decodes and validates a URI and returns the data in a QRData object.
 * @param {string} data
 * @param {'mainScanner' | 'send'} [source]
 * @param {SDK} [sdk]
 * @param {boolean} [showErrors]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const validateInputData = async ({
	data,
	source = 'mainScanner',
	sdk,
	showErrors,
	selectedNetwork,
	selectedWallet,
}: {
	data: string;
	source?: 'mainScanner' | 'send';
	sdk?: SDK;
	showErrors?: boolean;
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
}): Promise<Result<QRData>> => {
	if (!data) {
		return err('No data provided.');
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	try {
		const decodeRes = await decodeQRData(data, selectedNetwork);
		if (decodeRes.isErr() || !decodeRes.value.length) {
			const errorMessage = i18n.t('other:scan_err_interpret_msg');
			if (showErrors) {
				showToast({
					type: 'error',
					title: i18n.t('other:scan_err_interpret_title'),
					description: errorMessage,
				});
			}
			return err(errorMessage);
		}

		const decodedData = decodeRes.value[0];

		// Check if we're dealing with a Bitcoin payment request.
		if (
			decodeRes.value.length > 1 ||
			decodedData.qrDataType === 'bitcoinAddress' ||
			decodedData.qrDataType === 'lightningPaymentRequest'
		) {
			// Attempt to handle a unified Bitcoin transaction.
			const processBitcoinTxResponse = await processBitcoinTransactionData({
				data: decodeRes.value,
				selectedWallet,
				selectedNetwork,
			});
			if (processBitcoinTxResponse.isErr()) {
				return err(processBitcoinTxResponse.error.message);
			}
			return ok(processBitcoinTxResponse.value);
		}

		if (decodedData.qrDataType === 'slashURL') {
			if (!sdk) {
				const msg =
					'Slashtags SDK was not provided to processInputData method.';
				console.error(msg);
				return err(msg);
			}

			// If we're on the send screen, we need to additionally check for payment data.
			if (source === 'send') {
				const response = await processSlashPayURL({
					url: decodedData.url!,
				});
				if (response.isErr()) {
					const errorMessage = response.error.message;
					if (showErrors) {
						showToast({
							type: 'error',
							title: i18n.t('slashtags:error_pay_title'),
							description: `An error occurred: ${errorMessage}`,
						});
					}
					return err(errorMessage);
				}
				if (response.value.length === 0) {
					const errorMessage = i18n.t('slashtags:error_pay_empty_msg');
					if (showErrors) {
						showToast({
							type: 'error',
							title: i18n.t('slashtags:error_pay_title'),
							description: errorMessage,
						});
					}
					return err(errorMessage);
				}
				return ok(response.value[0]);
			} else {
				return ok(decodedData);
			}
		}

		if (decodedData.qrDataType === 'slashAuthURL') {
			if (source === 'send') {
				const errorMessage = i18n.t('other:scan_err_not_payable_msg');
				if (showErrors) {
					showToast({
						type: 'error',
						title: i18n.t('slashtags:error_pay_title'),
						description: errorMessage,
					});
				}
				return err(errorMessage);
			} else {
				return ok(decodedData);
			}
		}

		if (decodedData.qrDataType === 'slashFeedURL') {
			if (source === 'send') {
				const errorMessage = i18n.t('other:scan_err_not_payable_msg');
				if (showErrors) {
					showToast({
						type: 'error',
						title: i18n.t('slashtags:error_pay_title'),
						description: errorMessage,
					});
				}
				return err(errorMessage);
			} else {
				return ok(decodedData);
			}
		}

		return ok(decodedData);
	} catch (e) {
		console.error(e);
		return err(e);
	}
};
