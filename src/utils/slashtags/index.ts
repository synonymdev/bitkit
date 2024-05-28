import debounce from 'lodash/debounce';
import { ok, err, Result } from '@synonymdev/result';
import SlashtagsProfile from '@synonymdev/slashtags-profile';
import { format, parse } from '@synonymdev/slashtags-url';

import i18n from '../i18n';
import { showToast } from '../notifications';
import { BasicProfile, SlashPayConfig } from '../../store/types/slashtags';
import { cacheProfile } from '../../store/slices/slashtags';
import { TWalletName } from '../../store/types/wallet';
import { dispatch, getSettingsStore } from '../../store/helpers';
import { createLightningInvoice } from '../../store/utils/lightning';
import { EAvailableNetwork } from '../networks';
import { webRelayClient } from '../../components/SlashtagsProvider';
import { rootNavigation } from '../../navigation/root/RootNavigator';
import {
	decodeLightningInvoice,
	getClaimedLightningPayments,
	getOpenChannels,
	waitForLdk,
} from '../lightning';
import {
	getReceiveAddress,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import SlashpayConfig from './slashpay';

/**
 * Handles pasting or scanning a slash:// url
 */
export const handleSlashtagURL = (
	url: string,
	onError?: (error: Error) => void,
	onSuccess?: (url: string) => void,
): void => {
	try {
		const parsed = parse(url);

		if (parsed.protocol === 'slash:') {
			rootNavigation.navigate('ContactEdit', { url });
		} else if (parsed.protocol === 'slashfeed:') {
			rootNavigation.navigate('Widget', { url });
		}

		onSuccess?.(url);
	} catch (error) {
		onError?.(error as Error);
	}
};

export const saveProfile = async (
	url: string,
	profile: BasicProfile,
	slashtagsProfile: SlashtagsProfile,
): Promise<Result<string>> => {
	try {
		await slashtagsProfile.put(profile, { awaitRelaySync: true });
	} catch (e) {
		console.log('profile saving error', e);
		showToast({
			type: 'warning',
			title: i18n.t('slashtags:error_saving_contact'),
			description: `An error occurred: ${e.message}`,
		});
		return err(e);
	}

	dispatch(cacheProfile({ url, profile }));

	return ok('Profile saved');
};

const INVOICE_EXPIRY_DELTA = 60 * 60 * 24 * 7; // one week

export const getNewProfileUrl = (url: string, webRelayUrl: string): string => {
	const parsed = parse(url);
	const res = format(parsed.key, {
		query: { relay: webRelayUrl },
	});
	return res;
};

export const updateSlashPayConfig = debounce(
	async ({
		forceUpdate = false,
		selectedWallet = getSelectedWallet(),
		selectedNetwork = getSelectedNetwork(),
	}: {
		forceUpdate?: boolean;
		selectedWallet?: TWalletName;
		selectedNetwork?: EAvailableNetwork;
	} = {}): Promise<void> => {
		if (!webRelayClient) {
			console.debug('webRelayClient not ready yet');
			return;
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

		const openChannels = getOpenChannels();
		if (openChannels.length) {
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
export const getSlashPayConfig = async (
	url: string,
): Promise<SlashPayConfig> => {
	const url2 = getSlashpayURLfromProfile(url);
	const slashpay = new SlashpayConfig(webRelayClient);
	return (await slashpay.get(url2)) || [];
};

export const getSlashpayURLfromProfile = (profileURL: string): string => {
	const parsed = parse(profileURL);
	const res = format(parsed.key, {
		...parse(profileURL),
		path: '/slashpay.json',
	});
	return res;
};
