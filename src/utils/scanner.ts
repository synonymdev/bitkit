/**
 * Helper functions that allow for any possible bitcoin related QR to be scanned
 */

import bip21 from 'bip21';
import { address as bitcoinJSAddress } from 'bitcoinjs-lib';
import { err, ok, Result } from '@synonymdev/result';
import SDK from '@synonymdev/slashtags-sdk';
import { TInvoice } from '@synonymdev/react-native-ldk';
import {
	getLNURLParams,
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLResponse,
	LNURLWithdrawParams,
} from '@synonymdev/react-native-lnurl';

import {
	getOnchainTransactionData,
	getTransactionOutputAmount,
	parseOnChainPaymentRequest,
} from './wallet/transactions';
import { getLightningStore } from '../store/helpers';
import {
	showErrorNotification,
	showInfoNotification,
	showSuccessNotification,
} from './notifications';
import { updateBitcoinTransaction } from '../store/actions/wallet';
import { getBalance, getSelectedNetwork, getSelectedWallet } from './wallet';
import { toggleView } from '../store/actions/ui';
import { handleSlashtagURL } from './slashtags';
import { addPeer, decodeLightningInvoice } from './lightning';
import {
	availableNetworks,
	EAvailableNetworks,
	networks,
	TAvailableNetworks,
} from './networks';
import { getSlashPayConfig } from './slashtags';
import { savePeer } from '../store/actions/lightning';
import { TWalletName } from '../store/types/wallet';
import { sendNavigation } from '../navigation/bottom-sheet/SendNavigation';

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
	//TODO add xpub, lightning node peer etc
}

export interface QRData {
	network?: TAvailableNetworks | EAvailableNetworks;
	qrDataType: EQRDataType;
	sats?: number;
	address?: string;
	lightningPaymentRequest?: string;
	message?: string;
	lnUrlParams?:
		| LNURLAuthParams
		| LNURLWithdrawParams
		| LNURLChannelParams
		| LNURLPayParams
		| LNURLResponse;
	url?: string;
	slashTagsUrl?: string;
}

export const validateAddress = ({
	address = '',
	selectedNetwork,
}: {
	address: string;
	selectedNetwork?: EAvailableNetworks;
}): {
	isValid: boolean;
	network: EAvailableNetworks;
} => {
	try {
		//Validate address for a specific network
		if (selectedNetwork !== undefined) {
			bitcoinJSAddress.toOutputScript(address, networks[selectedNetwork]);
		} else {
			//Validate address for all available networks
			let isValid = false;
			let network: EAvailableNetworks = EAvailableNetworks.bitcoin;
			for (let i = 0; i < availableNetworksList.length; i++) {
				if (
					validateAddress({
						address,
						selectedNetwork: availableNetworksList[i],
					}).isValid
				) {
					isValid = true;
					network = availableNetworksList[i];
					break;
				}
			}
			return { isValid, network };
		}

		return { isValid: true, network: selectedNetwork };
	} catch (e) {
		return { isValid: false, network: EAvailableNetworks.bitcoin };
	}
};

export type TProcessedData = {
	type: EQRDataType;
	address?: string;
	amount?: number;
};

/**
 * This method processes, decodes and handles all scanned/pasted information provided by the user.
 * @param {string} data
 * @param {'mainScanner' | 'sendScanner'} [source]
 * @param {SDK} sdk
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 */
export const processInputData = async ({
	data,
	source = 'mainScanner',
	sdk,
	selectedNetwork,
	selectedWallet,
}: {
	data: string;
	source?: 'mainScanner' | 'sendScanner';
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: TWalletName;
	sdk?: SDK;
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
			const title = 'Decoding Error';
			showErrorNotification({
				title,
				message: decodeRes.error.message,
			});
			return err(title);
		}

		// Unable to interpret any of the provided data.
		if (!decodeRes?.value.length) {
			const message = 'Bitkit is unable to interpret the provided data.';
			showErrorNotification({
				title: 'Unable To Interpret Provided Data',
				message,
			});
			return err(message);
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
			source === 'sendScanner' &&
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
			const response = await processSlashPayURL({ url, sdk });

			if (response.isErr()) {
				showErrorNotification({
					title: 'Unable To Pay to this slashtag',
					message: response.error.message,
				});
				return err(response.error.message);
			}

			if (!Array.isArray(response.value) || response.value.length === 0) {
				showErrorNotification({
					title: 'Unable To Pay to this slashtag',
					message: 'Remote slashpay profile is empty',
				});
				return err('Remote slashpay profile is empty');
			}

			const processBitcoinTxResponse = await processBitcoinTransactionData({
				data: response.value,
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

	let foundNetworksInQR: QRData[] = [];
	let lightningInvoice = '';
	let error = '';

	//Lightning URI or plain lightning payment request
	if (
		data.toLowerCase().indexOf('lightning:') > -1 ||
		data.toLowerCase().startsWith('lntb') ||
		data.toLowerCase().startsWith('lnbc') ||
		data.toLowerCase().startsWith('lnurl')
	) {
		//If it's a lightning URI
		let invoice = data.replace('lightning:', '').toLowerCase();

		//Attempt to handle any lnurl request.
		if (invoice.startsWith('lnurl')) {
			const res = await getLNURLParams(invoice);
			if (res.isOk()) {
				const params = res.value;
				let tag = '';
				if ('tag' in params) {
					tag = params.tag;
				}

				let qrDataType: EQRDataType | undefined;

				switch (tag) {
					case 'login': {
						qrDataType = EQRDataType.lnurlAuth;
						break;
					}
					case 'withdrawRequest': {
						qrDataType = EQRDataType.lnurlWithdraw;
						break;
					}
					case 'channelRequest': {
						qrDataType = EQRDataType.lnurlChannel;
						break;
					}
					case 'payRequest': {
						qrDataType = EQRDataType.lnurlPay;
						break;
					}
				}

				if (qrDataType) {
					foundNetworksInQR.push({
						qrDataType,
						//No real difference between networks for lnurl, all keys are derived the same way so assuming current network
						network: selectedNetwork,
						lnUrlParams: params,
					});
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
		if (decodedInvoice.isOk()) {
			foundNetworksInQR.push({
				qrDataType: EQRDataType.lightningPaymentRequest,
				lightningPaymentRequest: data,
				network: selectedNetwork,
				sats: decodedInvoice.value?.amount_satoshis ?? 0,
				message: decodedInvoice.value?.description ?? '',
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
	sdk,
}: {
	url: string;
	sdk: SDK;
}): Promise<Result<QRData[]>> => {
	try {
		const payConfig = await getSlashPayConfig(sdk, url);
		const res = payConfig
			.map(({ type, value }) => {
				switch (type) {
					case 'p2wpkh':
					case 'p2sh':
					case 'p2pkh':
						if (!validateAddress({ address: value }).isValid) {
							return;
						}
						return {
							qrDataType: 'bitcoinAddress',
							address: value,
							sats: 0,
							slashTagsUrl: url,
						};
					case 'lightningInvoice':
						return {
							qrDataType: 'lightningPaymentRequest',
							lightningPaymentRequest: value,
							slashTagsUrl: url,
						};
				}
			})
			.filter((item) => !!item);

		return ok(res as QRData[]);
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
	selectedNetwork,
	selectedWallet,
}: {
	data: QRData[];
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
		let error: { title: string; message: string } | undefined; //Information that will be passed as a notification.
		let requestedAmount = 0; //Amount requested in sats by the provided invoice.

		const lightningBalance = getBalance({
			lightning: true,
			selectedWallet,
			selectedNetwork,
		});
		const openLightningChannels =
			getLightningStore().nodes[selectedWallet].openChannelIds[selectedNetwork];

		const onchainBalance = getBalance({
			onchain: true,
			selectedWallet,
			selectedNetwork,
		});

		// Filter for the lightning invoice.
		const filteredLightningInvoice = data.find(
			(d) => d.qrDataType === EQRDataType.lightningPaymentRequest,
		);
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
						title: 'Lightning Invoice Expired',
						message: 'Unfortunately, this lightning invoice has expired.',
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
			lightningBalance.satoshis
		) {
			// Ensure we can afford to pay the lightning invoice. If so, pass it through.
			if (lightningBalance.satoshis >= requestedAmount) {
				response = filteredLightningInvoice;
			} else {
				const diff = requestedAmount - lightningBalance.satoshis;
				error = {
					title: 'Unable to afford the lightning invoice',
					message: `(${diff} more sats needed.)`,
				};
			}
		}

		// If no lightning invoice response, attempt to grab an on-chain invoice.
		if (!response) {
			// Filter for the bitcoin address or on-chain invoice
			const filteredBitcoinInvoice = data.find(
				(d) => d.qrDataType === EQRDataType.bitcoinAddress,
			);
			if (filteredBitcoinInvoice) {
				const requestedOnChainAmount = filteredBitcoinInvoice?.sats ?? 0;
				// Only set a new requested amount if a value was specified in the invoice.
				if (requestedOnChainAmount) {
					requestedAmount = requestedOnChainAmount;
				}
			}

			// Attempt to pay the on-chain invoice if unable to pay with lightning.
			// Check that we have a bitcoin invoice and can afford to pay it.
			if (
				onchainBalance.satoshis &&
				filteredBitcoinInvoice &&
				filteredBitcoinInvoice?.sats !== undefined
			) {
				// If we can afford to pay it, pass it through.
				// Otherwise, set the provided address and set sats to 0.
				if (onchainBalance.satoshis > requestedAmount) {
					response = filteredBitcoinInvoice;
				} else {
					showInfoNotification({
						title: 'Unable to fulfill the requested invoice amount',
						message: `${
							requestedAmount - onchainBalance.satoshis
						} more sats needed.`,
					});
					const transaction = getOnchainTransactionData({
						selectedWallet,
						selectedNetwork,
					});

					// If the user already specified an amount in the app, don't override it.
					// Otherwise, set sats to 0.
					let sats = 0;
					if (transaction.isOk() && transaction.value?.outputs) {
						sats = transaction.value?.outputs[0]?.value ?? 0;
					}
					response = {
						...filteredBitcoinInvoice,
						sats,
					};
				}
			}
		}

		if (response) {
			return ok(response);
		}

		if (error) {
			showErrorNotification(error);
		} else {
			if (requestedAmount) {
				error = {
					title: `${requestedAmount} more sats needed`,
					message: 'Unable to pay the provided invoice',
				};
			} else {
				error = {
					title: 'Unable to pay the provided invoice',
					message: 'Please send more sats to Bitkit to process payments.',
				};
			}
			showErrorNotification(error);
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
		const message = 'Unable to read or interpret the provided data.';
		showErrorNotification({
			title: 'No data provided',
			message,
		});
		return err(message);
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (data.network && data.network !== selectedNetwork) {
		const message = `Bitkit is currently set to ${selectedNetwork} but data is for ${data.network}.`;
		showErrorNotification({
			title: 'Incorrect Network',
			message,
		});
		return err(message);
	}

	const qrDataType = data.qrDataType;
	const address = data.address ?? '';
	const lightningPaymentRequest = data.lightningPaymentRequest ?? '';
	let amount = data.sats ?? 0;
	const message = data.message ?? '';
	const slashTagsUrl = data.slashTagsUrl;

	//TODO(slashtags): Register Bitkit to handle all slash?x:// protocols
	switch (qrDataType) {
		case EQRDataType.slashtagURL: {
			handleSlashtagURL(data.url as string);
			toggleView({
				view: 'addContactModal',
				data: { isOpen: false },
			});
			return ok({ type: EQRDataType.slashtagURL });
		}
		case EQRDataType.slashFeedURL: {
			handleSlashtagURL(data.url as string);
			return ok({ type: EQRDataType.slashAuthURL });
		}
		case EQRDataType.slashAuthURL: {
			toggleView({
				view: 'slashauthModal',
				data: { isOpen: true, url: data.url },
			});
			return ok({ type: EQRDataType.slashAuthURL });
		}
		case EQRDataType.bitcoinAddress: {
			toggleView({
				view: 'sendNavigation',
				data: { isOpen: true },
			});

			// If no amount found in payment request, make sure that the user hasn't previously specified an amount from the send form.
			if (!amount) {
				const outputAmount = getTransactionOutputAmount({
					selectedNetwork,
					selectedWallet,
					outputIndex: 0,
				});
				if (outputAmount.isErr()) {
					return err(outputAmount.error.message);
				}
				amount = outputAmount.value;
			}

			await updateBitcoinTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					label: message,
					outputs: [{ address, value: amount, index: 0 }],
					slashTagsUrl,
				},
			});

			if (sendNavigation.isReady()) {
				sendNavigation.navigate('Amount');
			}

			return ok({ type: EQRDataType.bitcoinAddress, address, amount });
		}
		case EQRDataType.lightningPaymentRequest: {
			const decodedInvoice = await decodeLightningInvoice({
				paymentRequest: lightningPaymentRequest,
			});
			if (decodedInvoice.isErr()) {
				showErrorNotification({
					title: 'Unable To Decode Invoice',
					message: decodedInvoice.error.message,
				});
				return err(decodedInvoice.error.message);
			}

			toggleView({
				view: 'sendNavigation',
				data: { isOpen: true },
			});

			const invoiceAmount = decodedInvoice.value.amount_satoshis ?? 0;
			await updateBitcoinTransaction({
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

			if (sendNavigation.isReady()) {
				if (invoiceAmount) {
					sendNavigation.navigate('ReviewAndSend');
				} else {
					sendNavigation.navigate('Amount');
				}
			}

			return ok({
				type: EQRDataType.lightningPaymentRequest,
				amount: invoiceAmount,
			});
		}

		case EQRDataType.lnurlPay: {
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL-Pay is not yet supported.',
			});
			return ok({ type: EQRDataType.lnurlPay });

			/*const nodeId = await getNodeId();
			if (nodeId.isErr()) {
				const msg =
					'Unable to startup local lightning node at this time. Please try again or restart the app.';
				showErrorNotification({
					title: 'LNURL-Pay Error',
					message: msg,
				});
				return err(msg);
			}

			const params = data.lnUrlParams! as LNURLPayParams;
			const milliSats = params.minSendable;

			const callbackRes = await createPayRequestUrl({
				params,
				milliSats,
				comment: 'Bitkit LNURL-Pay',
			});
			if (callbackRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Pay failed',
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
			});*/
		}

		case EQRDataType.lnurlChannel: {
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL-Channel is not yet supported.',
			});
			return ok({ type: EQRDataType.lnurlChannel });

			/*const params = data.lnUrlParams! as LNURLChannelParams;
			const peer = params.uri;
			if (peer.includes('onion')) {
				const msg = 'Unable to add tor nodes at this time.';
				showErrorNotification({
					title: 'LNURL-Channel Request Error',
					message: `Error adding lightning peer: ${msg}`,
				});
				return err(msg);
			}

			const nodeId = await getNodeId();
			if (nodeId.isErr()) {
				const msg =
					'Unable to startup local lightning node at this time. Please try again or restart the app.';
				showErrorNotification({
					title: 'LNURL-Channel Request Error',
					message: msg,
				});
				return err(msg);
			}

			const addPeerRes = await addPeer({
				peer,
				timeout: 5000,
			});
			if (addPeerRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Channel Request Error',
					message: `Error adding lightning peer: ${addPeerRes.error.message}`,
				});
				return err('Unable to add lightning peer.');
			}
			const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
			if (savePeerRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Channel Request Error',
					message: `Unable to save lightning peer: ${savePeerRes.error.message}`,
				});
				return err(savePeerRes.error.message);
			}

			const callbackRes = await createChannelRequestUrl({
				localNodeId: nodeId.value,
				params,
				isPrivate: true,
				cancel: false,
			});
			if (callbackRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Channel Request failed',
					message: callbackRes.error.message,
				});
				return err(callbackRes.error.message);
			}

			showSuccessNotification({
				title: 'Success!',
				message: peer
					? `Successfully requested channel from: ${peer}.`
					: 'Successfully requested channel.',
			});
			return ok(EQRDataType.lnurlAuth);*/
		}

		case EQRDataType.lnurlAuth: {
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL-Auth is not yet supported.',
			});
			return ok({ type: EQRDataType.lnurlAuth });

			/*const getMnemonicPhraseResponse = await getMnemonicPhrase(selectedWallet);
			if (getMnemonicPhraseResponse.isErr()) {
				return err(getMnemonicPhraseResponse.error.message);
			}

			const authRes = await lnAuth({
				params: data.lnUrlParams as LNURLAuthParams,
				// @ts-ignore
				network: selectedNetwork,
				bip32Mnemonic: getMnemonicPhraseResponse.value,
			});
			if (authRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Auth failed',
					message: authRes.error.message,
				});
				return err(authRes.error.message);
			}

			showSuccessNotification({
				title: 'Authenticated!',
				message: data.lnUrlParams?.domain
					? `Successfully logged into: ${data.lnUrlParams?.domain}.`
					: 'Successfully logged in.',
			});
			return ok(EQRDataType.lnurlAuth);*/
		}
		case EQRDataType.lnurlWithdraw: {
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL-Withdraw is not yet supported.',
			});
			return ok({ type: EQRDataType.lnurlWithdraw });

			/*let params = data.lnUrlParams as LNURLWithdrawParams;
			const amountSats = params.maxWithdrawable / 1000; //Convert msats to sats.
			const description = params?.defaultDescription ?? '';

			// Determine if we have enough receiving capacity before proceeding.
			const lightningBalance = await getLightningBalance({
				selectedWallet,
				selectedNetwork,
				includeReserveBalance: false,
			});

			if (lightningBalance.remoteBalance < amountSats) {
				const msg =
					'Not enough inbound/receiving capacity to complete lnurl-withdraw request.';
				showErrorNotification({
					title: 'LNURL-Withdraw Error',
					message: msg,
				});
				return err(msg);
			}

			const invoice = await createLightningInvoice({
				expiryDeltaSeconds: 3600,
				amountSats,
				description,
				selectedWallet,
				selectedNetwork,
			});
			if (invoice.isErr()) {
				const msg = 'Unable to successfully create invoice for lnurl-withdraw.';
				showErrorNotification({
					title: 'LNURL-Withdraw Error',
					message: msg,
				});
				return err(msg);
			}
			const callbackRes = await createWithdrawCallbackUrl({
				params,
				paymentRequest: invoice.value.to_str,
			});
			if (callbackRes.isErr()) {
				console.log(callbackRes.error.message);
				const msg = 'Unable to resolve and finalize lnurl-withdraw.';
				showErrorNotification({
					title: 'LNURL-Withdraw Error',
					message: msg,
				});
				return err(msg);
			}
			showSuccessNotification({
				title: 'Withdraw Requested',
				message: 'LNURL Withdraw was successfully requested.',
			});
			return ok(EQRDataType.lnurlWithdraw);*/
		}

		case EQRDataType.nodeId: {
			const peer = data?.url;
			if (!peer) {
				return err('Unable to interpret peer information.');
			}
			if (peer.includes('onion')) {
				const msg = 'Unable to add tor nodes at this time.';
				showErrorNotification({
					title: 'Error adding lightning peer',
					message: msg,
				});
				return err(msg);
			}
			const addPeerRes = await addPeer({
				peer,
				timeout: 5000,
			});
			if (addPeerRes.isErr()) {
				showErrorNotification({
					title: 'Unable to add lightning peer',
					message: addPeerRes.error.message,
				});
				return err('Unable to add lightning peer.');
			}
			const savePeerRes = savePeer({ selectedWallet, selectedNetwork, peer });
			if (savePeerRes.isErr()) {
				showErrorNotification({
					title: 'Unable to save lightning peer',
					message: savePeerRes.error.message,
				});
				return err(savePeerRes.error.message);
			}
			showSuccessNotification({
				title: savePeerRes.value,
				message: 'Lightning peer added & saved',
			});
			toggleView({
				view: 'sendNavigation',
				data: { isOpen: false },
			});
			return ok({ type: EQRDataType.nodeId });
		}

		default:
			return err('Unable to read or interpret the provided data.');
	}
};
