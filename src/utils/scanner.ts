/**
 * Helper functions that allow for any possible bitcoin related QR to be scanned
 */

import bip21 from 'bip21';
import { address as bitcoinJSAddress } from 'bitcoinjs-lib';
import { err, ok, Result } from '@synonymdev/result';
import SDK from '@synonymdev/slashtags-sdk';
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
	parseOnChainPaymentRequest,
} from './wallet/transactions';
import { getStore } from '../store/helpers';
import { showErrorNotification, showInfoNotification } from './notifications';
import { updateBitcoinTransaction } from '../store/actions/wallet';
import { getBalance, getSelectedNetwork, getSelectedWallet } from './wallet';
import { toggleView } from '../store/actions/user';
import { sleep } from './helpers';
import { handleSlashtagURL } from './slashtags';
import { decodeLightningInvoice } from './lightning';
import {
	availableNetworks,
	EAvailableNetworks,
	networks,
	TAvailableNetworks,
} from './networks';
import { getSlashPayConfig } from '../utils/slashtags';

const availableNetworksList = availableNetworks();

export enum EQRDataType {
	bitcoinAddress = 'bitcoinAddress',
	lightningPaymentRequest = 'lightningPaymentRequest',
	lnurlAuth = 'lnurlAuth',
	lnurlWithdraw = 'lnurlWithdraw',
	slashAuthURL = 'slashAuthURL',
	slashtagURL = 'slashURL',
	slashFeedURL = 'slashFeedURL',
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
	selectedNetwork = undefined,
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

/**
 * This method processes, decodes and handles all scanned/pasted information provided by the user.
 * @param {string} data
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {string} [selectedWallet]
 */
export const processInputData = async ({
	data = '',
	source = 'mainScanner',
	sdk,
	selectedNetwork,
	selectedWallet,
}: {
	data: string;
	source: 'mainScanner' | 'sendScanner';
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
	sdk: SDK;
}): Promise<Result<EQRDataType>> => {
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
			const title = 'Bitkit is unable to read the provided data.';
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
				showErrorNotification({
					title: 'Unable To Pay Invoice',
					message: processBitcoinTxResponse.error.message,
				});
				return err(processBitcoinTxResponse.error.message);
			}
			dataToHandle = processBitcoinTxResponse.value;
		} else if (
			source === 'sendScanner' &&
			decodeRes.value[0].qrDataType === 'slashURL'
		) {
			// Check if this is a slashtag url and we want to send funds to it
			const url = decodeRes.value[0].url ?? '';
			const response = await processSlashPayURL({ url, sdk });

			if (response.isErr()) {
				showErrorNotification({
					title: 'Unable To Pay to this slashtag',
					message: response.error.message,
				});
				return err(response.error.message);
			}

			const processBitcoinTxResponse = await processBitcoinTransactionData({
				data: response.value,
				selectedWallet,
				selectedNetwork,
			});
			if (processBitcoinTxResponse.isErr()) {
				showErrorNotification({
					title: 'Unable To Pay Invoice',
					message: processBitcoinTxResponse.error.message,
				});
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

	let foundNetworksInQR: QRData[] = [];
	let lightningInvoice = '';

	//Lightning URI or plain lightning payment request
	if (
		data.toLowerCase().indexOf('lightning:') > -1 ||
		data.toLowerCase().startsWith('lntb') ||
		data.toLowerCase().startsWith('lnbc') ||
		data.toLowerCase().startsWith('lnurl')
	) {
		//If it's a lightning URI
		let invoice = data.replace('lightning:', '').toLowerCase();

		if (data.startsWith('lnurl')) {
			//LNURL-auth
			const res = await getLNURLParams(data);
			if (res.isErr()) {
				return err(res.error);
			}

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
			}

			if (qrDataType) {
				foundNetworksInQR.push({
					qrDataType,
					//No real difference between networks for lnurl, all keys are derived the same way so assuming current network
					network: getStore().wallet.selectedNetwork,
					lnUrlParams: params,
				});
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
		}

		const { options } = bip21.decode(data);

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
			}
		}
	} catch (e) {}

	if (lightningInvoice) {
		const decodedInvoice = await decodeLightningInvoice({
			paymentRequest: data,
		});
		if (decodedInvoice.isOk()) {
			foundNetworksInQR.push({
				qrDataType: EQRDataType.lightningPaymentRequest,
				lightningPaymentRequest: data,
				network: selectedNetwork,
				sats: decodedInvoice.value?.amount_satoshis ?? 0,
				message: decodedInvoice.value?.description ?? '',
			});
		}
	}

	return ok(foundNetworksInQR);
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
 * @param {string} [selectedWallet]
 */
export const processBitcoinTransactionData = async ({
	data = [],
	selectedNetwork,
	selectedWallet,
}: {
	data: QRData[];
	selectedNetwork?: TAvailableNetworks;
	selectedWallet?: string;
}): Promise<Result<QRData>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		let response;

		const lightningBalance = getBalance({
			lightning: true,
			selectedWallet,
			selectedNetwork,
		});
		const openLightningChannels =
			getStore().lightning.nodes[selectedWallet].openChannelIds[
				selectedNetwork
			];

		const onchainBalance = getBalance({
			onchain: true,
			selectedWallet,
			selectedNetwork,
		});

		// Attempt to pay with lightning first.
		// Check that we have some open channels.
		if (openLightningChannels?.length) {
			// Filter for the lightning invoice.
			const filteredLightningInvoice = data.filter(
				(d) => d.qrDataType === EQRDataType.lightningPaymentRequest,
			);
			// Check that we have a lightning invoice, decode it and determine if we can afford to pay it.
			if (filteredLightningInvoice.length && lightningBalance?.satoshis) {
				const decodedLightningInvoice = await decodeLightningInvoice({
					paymentRequest:
						filteredLightningInvoice[0]?.lightningPaymentRequest ?? '',
				});
				if (decodedLightningInvoice.isOk()) {
					// Ensure the invoice has not expired.
					if (decodedLightningInvoice.value.is_expired) {
						showInfoNotification({
							title: 'Lightning Invoice Expired',
							message: 'Unfortunately, this lightning invoice has expired.',
						});
					} else {
						// Ensure we can afford to pay the lightning invoice. If so, pass it through.
						if (
							lightningBalance.satoshis >
							(decodedLightningInvoice.value?.amount_satoshis ?? 0)
						) {
							response = filteredLightningInvoice[0];
						}
					}
				}
			}
		}

		// Attempt to pay the on-chain invoice if unable to pay with lightning.
		// Check that we have a bitcoin invoice and can afford to pay it.
		if (!response) {
			// Filter for the bitcoin address or on-chain invoice
			const filteredBitcoinInvoice = data.filter(
				(d) => d.qrDataType === EQRDataType.bitcoinAddress,
			);
			// Check that we have a Bitcoin invoice and determine if we can afford to pay it.
			if (
				filteredBitcoinInvoice?.length > 0 &&
				filteredBitcoinInvoice[0]?.sats !== undefined
			) {
				// If we can afford to pay it, pass it through.
				// Otherwise, set the provided address and set sats to 0.
				if (onchainBalance.satoshis > filteredBitcoinInvoice[0]?.sats) {
					response = filteredBitcoinInvoice[0];
				} else {
					// If the user already specified an amount, don't override it.
					const transaction = getOnchainTransactionData({
						selectedWallet,
						selectedNetwork,
					});

					// If we have enough sats to cover the requested amount, set the value accordingly.
					// Otherwise, set sats to 0.
					let sats = 0;
					if (transaction.isOk() && transaction.value?.outputs) {
						sats = transaction.value?.outputs[0]?.value ?? 0;
					}
					response = {
						...filteredBitcoinInvoice[0],
						sats,
					};
				}
			}
		}
		if (response) {
			return ok(response);
		}
		return err('Unable to pay the provided invoice.');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * This method will handle all actions required for each valid EQRDataType passed as data.
 * @param {QRData} data
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const handleData = async ({
	data,
	selectedWallet,
	selectedNetwork,
}: {
	data: QRData;
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<EQRDataType>> => {
	if (!data) {
		const message = 'Unable to read or interpret the provided data.';
		showErrorNotification(
			{
				title: 'No data provided',
				message,
			},
			'bottom',
		);
		return err(message);
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (data?.network && data?.network !== selectedNetwork) {
		const message = `App is currently set to ${selectedNetwork} but data is for ${data.network}.`;
		showErrorNotification(
			{
				title: 'Incorrect network',
				message,
			},
			'bottom',
		);
		return err(message);
	}

	const qrDataType = data?.qrDataType;
	const address = data?.address ?? '';
	const lightningPaymentRequest = data?.lightningPaymentRequest ?? '';
	const amount = data?.sats ?? 0;
	const message = data?.message ?? '';
	const slashTagsUrl = data?.slashTagsUrl;

	//TODO(slashtags): Register Bitkit to handle all slash?x:// protocols
	switch (qrDataType) {
		case EQRDataType.slashtagURL: {
			handleSlashtagURL(data.url as string);
			return ok(EQRDataType.slashtagURL);
		}
		case EQRDataType.slashFeedURL: {
			handleSlashtagURL(data.url as string);
			return ok(EQRDataType.slashAuthURL);
		}
		case EQRDataType.slashAuthURL: {
			toggleView({
				view: 'slashauthModal',
				data: { isOpen: true, url: data.url },
			});
			return ok(EQRDataType.slashAuthURL);
		}
		case EQRDataType.bitcoinAddress: {
			toggleView({
				view: 'sendNavigation',
				data: {
					isOpen: true,
					snapPoint: 0,
				},
			});
			await sleep(5); //This is only needed to prevent the view from briefly displaying the SendAssetList
			await updateBitcoinTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					label: message,
					outputs: [{ address, value: amount, index: 0 }],
					slashTagsUrl,
				},
			});
			return ok(EQRDataType.bitcoinAddress);
		}
		case EQRDataType.lightningPaymentRequest: {
			const decodedInvoice = await decodeLightningInvoice({
				paymentRequest: lightningPaymentRequest,
			});
			if (decodedInvoice.isErr()) {
				showErrorNotification(
					{
						title: 'Unable To Decode Invoice',
						message: decodedInvoice.error.message,
					},
					'bottom',
				);
				return err(decodedInvoice.error.message);
			}
			toggleView({
				view: 'sendNavigation',
				data: {
					isOpen: true,
					snapPoint: 0,
				},
			});
			await sleep(5); //This is only needed to prevent the view from briefly displaying the SendAssetList
			await updateBitcoinTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					outputs: [
						{
							address: '',
							value: decodedInvoice.value?.amount_satoshis ?? 0,
							index: 0,
						},
					],
					lightningInvoice: lightningPaymentRequest,
					slashTagsUrl,
				},
			});
			return ok(EQRDataType.lightningPaymentRequest);
		}
		case EQRDataType.lnurlAuth: {
			// TODO: LDK
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL Auth is not yet supported.',
			});
			return ok(EQRDataType.lnurlAuth);
			/*const getMnemonicPhraseResponse = await getMnemonicPhrase(selectedWallet);
			if (getMnemonicPhraseResponse.isErr()) {
				return;
			}

			const authRes = await lnurlAuth({
				params: data.lnUrlParams! as LNURLAuthParams,
				network: selectedNetwork,
				bip32Mnemonic: getMnemonicPhraseResponse.value,
			});
			if (authRes.isErr()) {
				showErrorNotification({
					title: 'LNURL-Auth failed',
					message: authRes.error.message,
				});
				return;
			}

			showSuccessNotification({
				title: 'Authenticated!',
				message: '',
			});

			break;*/
		}
		case EQRDataType.lnurlWithdraw: {
			//let params = data.lnUrlParams as LNURLWithdrawParams;
			//const sats = params.maxWithdrawable / 1000; //LNURL unit is msats
			//TODO: Create invoice
			showInfoNotification({
				title: 'Not Supported',
				message: 'LNURL Withdraw is not yet supported.',
			});
			return ok(EQRDataType.lnurlWithdraw);
		}
	}
	return err('Unable to read or interpret the provided data.');
};
