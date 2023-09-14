import debounce from 'lodash.debounce';
import { ok, err, Result } from '@synonymdev/result';
import SlashtagsProfile from '@synonymdev/slashtags-profile';
import { format, parse } from '@synonymdev/slashtags-url';

import i18n from '../i18n';
import { showToast } from '../notifications';
import { BasicProfile, SlashPayConfig } from '../../store/types/slashtags';
import { cacheProfile2 } from '../../store/actions/slashtags';
import { TWalletName } from '../../store/types/wallet';
import { getSettingsStore } from '../../store/helpers';
import { createLightningInvoice } from '../../store/actions/lightning';
import { TAvailableNetworks } from '../networks';
import { webRelayClient } from '../../components/SlashtagsProvider2';
import {
	decodeLightningInvoice,
	getClaimedLightningPayments,
	waitForLdk,
} from '../lightning';
import {
	getCurrentWallet,
	getReceiveAddress,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import SlashpayConfig from './slashpay';
import { __WEB_RELAY__ } from '../../constants/env';

export const saveProfile2 = async (
	url: string,
	profile: BasicProfile,
	slashtagsProfile: SlashtagsProfile,
): Promise<Result<string>> => {
	try {
		await slashtagsProfile.put(profile);
	} catch (e) {
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_saving_contact'),
			description: e.message,
		});
		return err(e);
	}

	cacheProfile2(url, profile);

	return ok('Profile saved');
};

const INVOICE_EXPIRY_DELTA = 60 * 60 * 24 * 7; // one week

export const getNewProfileUrl = (url: string): string => {
	const parsed = parse(url);
	const res = format(parsed.key, {
		query: { relay: __WEB_RELAY__ },
	});
	return res;
};

export const updateSlashPayConfig2 = debounce(
	async ({
		forceUpdate = false,
		selectedWallet,
		selectedNetwork,
	}: {
		forceUpdate?: boolean;
		selectedWallet?: TWalletName;
		selectedNetwork?: TAvailableNetworks;
	}): Promise<void> => {
		if (!webRelayClient) {
			console.debug('webRelayClient not ready yet');
			return;
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const slashpay = new SlashpayConfig(webRelayClient);
		const url = await slashpay.createURL();

		let payConfig: SlashPayConfig = [];
		try {
			payConfig = (await slashpay.get(url)) || [];
		} catch (e) {
			console.log(e);
		}

		const { enableOfflinePayments, receivePreference } = getSettingsStore();

		if (!enableOfflinePayments) {
			// if offline payments are disabled and payment config is empty then do nothing
			if (payConfig.length === 0) {
				return;
			}

			// if offline payments are disabled and payment config is not empty then delete it
			await slashpay.put([]);
			console.debug('Deleted slashpay.json');
			return;
		}

		let needToUpdate = false;
		const newPayConfig: SlashPayConfig = [];

		// check if we need to update onchain address
		const addressType = getSelectedAddressType({
			selectedWallet,
			selectedNetwork,
		});

		const currentAddress = payConfig.find(
			({ type }) => type === addressType,
		)?.value;
		const newAddress = await getReceiveAddress({
			selectedWallet,
			selectedNetwork,
		});
		if (newAddress.isOk() && currentAddress !== newAddress.value) {
			// use new address
			needToUpdate = true;
			newPayConfig.push({ type: addressType, value: newAddress.value });
		} else if (currentAddress) {
			// keep old address
			newPayConfig.push({ type: addressType, value: currentAddress });
		}

		// check if we need to update LN invoice
		await waitForLdk();
		const { currentLightningNode } = getCurrentWallet({
			selectedWallet,
			selectedNetwork,
		});
		const openChannelIds = currentLightningNode.openChannelIds[selectedNetwork];

		if (openChannelIds.length) {
			const currentInvoice =
				payConfig.find(({ type }) => type === 'lightningInvoice')?.value ?? '';

			const decodedInvoice = await decodeLightningInvoice({
				paymentRequest: currentInvoice,
			});

			const claimedPayments = await getClaimedLightningPayments();

			// if currentInvoice still not in react-native-ldk's claimed payments list, then we don't need to update it.
			const currentInvoiceStillUnpaid =
				currentInvoice &&
				decodedInvoice.isOk() &&
				!claimedPayments.find(
					(p) => p.payment_hash === decodedInvoice.value.payment_hash,
				);

			const invoiceNeedsToBeUpdated =
				forceUpdate ||
				!currentInvoice ||
				!currentInvoiceStillUnpaid ||
				decodedInvoice.isErr() ||
				decodedInvoice.value.is_expired;

			if (invoiceNeedsToBeUpdated) {
				const response = await createLightningInvoice({
					amountSats: 0,
					description: '',
					expiryDeltaSeconds: INVOICE_EXPIRY_DELTA,
					selectedNetwork,
					selectedWallet,
				});

				if (response.isOk()) {
					needToUpdate = true;
					newPayConfig.push({
						type: 'lightningInvoice',
						value: response.value.to_str,
					});
				} else if (currentInvoice) {
					// if we can't get new invoice, keep an old one
					newPayConfig.push({
						type: 'lightningInvoice',
						value: currentInvoice,
					});
				}
			} else {
				// keeping old invoice
				newPayConfig.push({
					type: 'lightningInvoice',
					value: currentInvoice,
				});
			}
		}

		if (needToUpdate || forceUpdate) {
			// Put preferred payment method first in the array
			const sortedPayConfig = newPayConfig.sort((a) => {
				if (
					a.type === 'lightningInvoice' &&
					receivePreference[0].key === 'lightning'
				) {
					return -1;
				} else {
					return 1;
				}
			});

			try {
				await slashpay.put(sortedPayConfig);
				// await drive.put('/slashpay.json', encodeJSON(sortedPayConfig));
				console.debug('Updated slashpay.json:', sortedPayConfig);
			} catch (e) {
				console.log(e);
			}
		}

		slashpay.close();
	},
	5000,
);

/** Get the slashpay.json of remote contact */
export const getSlashPayConfig2 = async (
	url: string,
): Promise<SlashPayConfig> => {
	const url2 = getSlashpayURLfromProfile2(url);
	const slashpay = new SlashpayConfig(webRelayClient);
	return (await slashpay.get(url2)) || [];
};

export const getSlashpayURLfromProfile2 = (profileURL: string): string => {
	const parsed = parse(profileURL);
	const res = format(parsed.key, {
		...parse(profileURL),
		path: '/slashpay.json',
	});
	return res;
};
