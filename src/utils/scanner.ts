/**
 * Helper functions that allow for any possible bitcoin related QR to be scanned
 */

import bip21 from 'bip21';
import { err, ok, Result } from '@synonymdev/result';
import { Alert } from 'react-native';
import { address as bitcoinJSAddress } from 'bitcoinjs-lib';
import {
	getLNURLParams,
	LNURLAuthParams,
	LNURLChannelParams,
	LNURLPayParams,
	LNURLResponse,
	LNURLWithdrawParams,
} from '@synonymdev/react-native-lnurl';

import {
	availableNetworks,
	EAvailableNetworks,
	networks,
	TAvailableNetworks,
} from './networks';
import { parseOnChainPaymentRequest } from './wallet/transactions';
import { getStore } from '../store/helpers';
import { showErrorNotification } from './notifications';
import { updateOnChainTransaction } from '../store/actions/wallet';
import { getSelectedNetwork, getSelectedWallet, refreshWallet } from './wallet';
import { toggleView } from '../store/actions/user';
import { sleep } from './helpers';
import { handleSlashtagURL } from './slashtags';

const availableNetworksList = availableNetworks();

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

export enum EQRDataType {
	bitcoinAddress = 'bitcoinAddress',
	lightningPaymentRequest = 'lightningPaymentRequest',
	lnurlAuth = 'lnurlAuth',
	lnurlWithdraw = 'lnurlWithdraw',
	slashAuthURL = 'slashAuthURL',
	slasthagURL = 'slashURL',
	//TODO add rgb, xpub, lightning node peer etc
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
}

/**
 * Return all networks and their payment request details if found in QR data.
 * Can also be used to read clipboard data for any addresses or payment requests.
 * @param data
 * @returns {string}
 */
export const decodeQRData = async (
	data: string,
	selectedNetwork?: TAvailableNetworks,
): Promise<Result<QRData[]>> => {
	if (data.startsWith('slashauth://')) {
		return ok([{ qrDataType: EQRDataType.slashAuthURL, url: data }]);
	} else if (data.startsWith('slash://')) {
		return ok([{ qrDataType: EQRDataType.slasthagURL, url: data }]);
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
			lightningInvoice = options.lightning;
		}
	} catch (e) {}

	if (lightningInvoice) {
		// TODO: Decode Lightning Invoice
	}

	// If we've found any of the above bitcoin QR data don't decode for other networks
	if (foundNetworksInQR.length > 0) {
		return ok(foundNetworksInQR);
	}

	return ok(foundNetworksInQR);
};

export const handleData = async ({
	qrData,
	selectedWallet,
	selectedNetwork,
}: {
	qrData: QRData[];
	selectedWallet?: string;
	selectedNetwork?: TAvailableNetworks;
}): Promise<void> => {
	if (!qrData) {
		return showErrorNotification(
			{
				title: 'No data provided',
				message: 'Unable to read or interpret data from the provided QR code.',
			},
			'bottom',
		);
	}

	// Multiple payment requests, like bitcoin and lightning in on QR. Show them the options they have and then handle the selected one.
	let data: undefined | QRData;
	if (qrData.length > 1) {
		data = await new Promise((resolve) => {
			Alert.alert('Which one to use?', '', [
				{
					text: 'Cancel',
					onPress: (): void => resolve(undefined),
					style: 'cancel',
				},
				...qrData.map((selectedOption) => ({
					text: selectedOption.qrDataType,
					onPress: (): void => resolve(selectedOption),
				})),
			]);
		});
	} else {
		data = qrData[0];
	}

	if (data === undefined) {
		return;
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (data?.network && data?.network !== selectedNetwork) {
		return showErrorNotification(
			{
				title: 'Unsupported network',
				message: `App is currently set to ${selectedNetwork} but QR is for ${data.network}.`,
			},
			'bottom',
		);
	}

	const qrDataType = data?.qrDataType;
	const address = data?.address ?? '';
	const amount = data?.sats ?? 0;
	const message = data?.message ?? '';

	//TODO(slashtags): Handle contacts' urls
	//TODO(slashtags): Register Bitkit to handle all slash?x:// protocols
	switch (qrDataType) {
		case EQRDataType.slasthagURL: {
			handleSlashtagURL(data.url as string);
			break;
		}
		case EQRDataType.bitcoinAddress: {
			toggleView({
				view: 'sendNavigation',
				data: {
					isOpen: true,
					snapPoint: 0,
					initial: 'AddressAndAmount',
					assetName: 'Bitcoin',
				},
			});
			await sleep(5); //This is only needed to prevent the view from briefly displaying the SendAssetList
			updateOnChainTransaction({
				selectedWallet,
				selectedNetwork,
				transaction: {
					label: message,
					outputs: [{ address, value: amount }],
				},
			}).then();
			refreshWallet({});
			break;
		}
		case EQRDataType.lightningPaymentRequest: {
			// TODO: LDK
			break;
			/*const { pin, biometrics } = hasEnabledAuthentication();
			if (pin || biometrics) {
				navigation.navigate('AuthCheck', {
					onSuccess: () => {
						navigation.pop();
						setTimeout(() => {
							payLightningInvoicePrompt(data);
						}, 500);
					},
				});
			} else {
				payLightningInvoicePrompt(data);
			}
			break;*/
		}
		case EQRDataType.lnurlAuth: {
			// TODO: LDK
			break;
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
			break;
		}
	}
};
