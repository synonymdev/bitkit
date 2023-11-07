import SDK, { Slashtag, Hyperdrive } from '@synonymdev/slashtags-sdk';
import { parse } from '@synonymdev/slashtags-url';
import b4a from 'b4a';
import mime from 'mime/lite';
import debounce from 'lodash/debounce';

import { __SLASHTAGS_SEEDER_BASE_URL__ } from '../../constants/env';
import { rootNavigation } from '../../navigation/root/RootNavigator';
import { BasicProfile, SlashPayConfig } from '../../store/types/slashtags';
import { showToast } from '../notifications';
import {
	getCurrentWallet,
	getReceiveAddress,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import {
	decodeLightningInvoice,
	getClaimedLightningPayments,
	waitForLdk,
} from '../lightning';
import { createLightningInvoice } from '../../store/actions/lightning';
import { getSettingsStore } from '../../store/helpers';
import { TAvailableNetworks } from '../networks';
import { TWalletName } from '../../store/types/wallet';
import { cacheProfile } from '../../store/actions/slashtags';
import i18n from '../i18n';

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

/**
 * Returns the selected Slashtag.
 * Currently we don't support multiple personas so it returns the root(default) slashtag.
 */
export const getSelectedSlashtag = (sdk: SDK): Slashtag => {
	return sdk.slashtag();
};

/**
 * Saves a contact record in the contacts drive, and cache it in the store.
 */
// TODO(slashtags): should we add this to salshtag.setContact() ?
export const saveContact = async (
	slashtag: Slashtag,
	url: string,
	record: BasicProfile,
): Promise<void> => {
	if (checkClosed(slashtag)) {
		return;
	}

	const drive = await slashtag.drivestore.get('contacts');
	const { id } = parse(url);
	await drive?.put('/' + id, encodeJSON(record)).catch((error: Error) => {
		console.log(error.message);
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_saving_contact'),
			description: `An error occurred: ${error.message}`,
		});
	});
	drive.close();
};

export const saveProfile = async (
	slashtag: Slashtag,
	profile: BasicProfile,
): Promise<void> => {
	if (checkClosed(slashtag)) {
		return;
	}

	const drive = await slashtag?.drivestore.get();
	await drive.put('/profile.json', encodeJSON(profile)).catch((error: Error) =>
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_saving_profile'),
			description: error.message,
		}),
	);

	cacheProfile(slashtag.url, drive.files.feed.fork, drive.version, profile);

	drive.close();
};

/**
 * Deletes a contact from the 'contacts' SlashDrive
 */
// TODO(slashtags): should we add a slashtag.deleteContact()?
export const deleteContact = async (
	slashtag: Slashtag,
	url: string,
): Promise<void> => {
	if (checkClosed(slashtag)) {
		return;
	}

	const drive = await slashtag.drivestore.get('contacts');
	const { id } = parse(url);
	await drive.del('/' + id).catch((error: Error) => {
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_delete_contact'),
			description: error.message,
		});
	});

	drive.close();
};

/**
 * A helper function for saving many contacts at once for debugging purposes.
 * Generate a list using stpg's createBulkContacts and replace the urls array below.
 */
export const saveBulkContacts = async (slashtag: Slashtag): Promise<void> => {
	if (checkClosed(slashtag)) {
		return;
	}

	// Keep it empty on commit
	const urls: Array<string> = [];
	console.debug('Saving bulk contacts', { count: urls.length });

	const drive = await slashtag.drivestore.get('contacts');
	const batch = drive.batch();

	await Promise.all(
		urls.map(async (url) => {
			const name = Math.random().toString(16).slice(2, 8);
			const { id } = parse(url);
			return batch?.put('/' + id, encodeJSON({ name }));
		}),
	);
	await batch.flush();
	console.debug('Done saving bulk contacts');
	drive.close();
};

export const onSDKError = (error: Error): void => {
	// TODO (slashtags) move this error management to the SDK
	if (error.message.endsWith('Connection refused')) {
		error = new Error("Bitkit couldn't connect to the relay.");
	} else {
		error = new Error(`An error occurred: ${error.message}`);
	}

	showToast({
		type: 'error',
		title: 'Data Connection Issue',
		description: error.message,
	});
};

const INVOICE_EXPIRY_DELTA = 60 * 60 * 24 * 7; // one week

export const updateSlashPayConfig = debounce(
	async ({
		forceUpdate = false,
		sdk,
		selectedWallet,
		selectedNetwork,
	}: {
		forceUpdate?: boolean;
		sdk?: SDK;
		selectedWallet?: TWalletName;
		selectedNetwork?: TAvailableNetworks;
	}): Promise<void> => {
		if (!sdk) {
			// sdk is not ready yet
			return;
		}
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const slashtag = getSelectedSlashtag(sdk);
		const drive = slashtag.drivestore.get();

		let payConfig: SlashPayConfig = [];
		try {
			const buffer = await drive.get('/slashpay.json');
			const json = decodeJSON(buffer) as SlashPayConfig | undefined;
			payConfig = json ?? [];
		} catch (err) {
			console.log(err);
		}

		const { enableOfflinePayments, receivePreference } = getSettingsStore();

		if (!enableOfflinePayments) {
			// if offline payments are disabled and payment config is empty then do nothing
			if (payConfig.length === 0) {
				return;
			}

			// if offline payments are disabled and payment config is not empty then delete it
			await drive.put('/slashpay.json', encodeJSON([]));
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
				await drive.put('/slashpay.json', encodeJSON(sortedPayConfig));
				console.debug('Updated slashpay.json:', sortedPayConfig);
			} catch (err) {
				console.log(err);
			}
		}

		drive.close();
	},
	5000,
);

/** Send hypercores to seeder */
export const seedDrives = async (slashtag: Slashtag): Promise<boolean> => {
	// TODO (slashtags) https://github.com/synonymdev/slashtags/issues/56
	let drives: Hyperdrive[] = [];
	drives.push(slashtag.drivestore.get());
	drives.push(slashtag.drivestore.get('contacts'));

	// TODO (slashtags) move this logic (getting keys to be seeded) to the SDK
	return Promise.all(
		drives.map(async (drive: Hyperdrive) => {
			await drive.ready();
			await drive.getBlobs();
			const keys = [
				b4a.toString(drive.key, 'hex'),
				b4a.toString(drive.blobs.core.key, 'hex'),
			];

			const firstResponse = await fetch(
				__SLASHTAGS_SEEDER_BASE_URL__ + '/seeding/hypercore',
				{
					method: 'POST',
					body: JSON.stringify({ publicKey: keys[0] }),
					headers: { 'Content-Type': 'application/json' },
				},
			);

			const secondResponse = await fetch(
				__SLASHTAGS_SEEDER_BASE_URL__ + '/seeding/hypercore',
				{
					method: 'POST',
					body: JSON.stringify({ publicKey: keys[1] }),
					headers: { 'Content-Type': 'application/json' },
				},
			);

			drive.close();
			return [firstResponse.status, secondResponse.status].every(
				(s) => s === 200,
			);
		}),
	)
		.then((results) => results.every(Boolean))
		.catch((error) => {
			console.debug('Error in seeding drives request', {
				error: error.message,
			});
			return false;
		});
};

/** Get the slashpay.json of remote contact */
export const getSlashPayConfig = async (
	sdk: SDK,
	url: string,
): Promise<SlashPayConfig> => {
	if (sdk.closed) {
		console.debug('getSlashPayConfig: SKIP sdk is closed');
		return [];
	}

	const drive = sdk.drive(parse(url).key);
	await drive.ready().catch(noop);
	const payConfig =
		(await drive.get('/slashpay.json').then(decodeJSON).catch(noop)) || [];

	drive.close();
	return payConfig;
};

function noop(): void {}

function checkClosed(slashtag: Slashtag): boolean {
	if (slashtag.drivestore.closed) {
		showToast({
			type: 'error',
			title: i18n.t('slashtags:error_sdk_title'),
			description: i18n.t('slashtags:error_sdk_msg'),
		});
		return true;
	} else {
		return false;
	}
}

/**
 * CURRENTLY UNUSED
 * Check if a given string is a valid slashtag URL
 */
export const validateSlashtagURL = (url: string): boolean => {
	try {
		const parsed = parse(url);
		if (parsed.protocol === 'slash:') {
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
};

/**
 * Decode JSON from Uint8Array files from Hyperdrives
 */
export function decodeJSON(buf: Uint8Array | null): object | undefined {
	if (!buf || buf.byteLength === 0) {
		return;
	}
	try {
		return JSON.parse(b4a.toString(buf));
	} catch (error) {}
}

/**
 * Encode JSON as Uint8Array for hyperdrive json files
 */
export function encodeJSON(json: object): Uint8Array {
	return b4a.from(JSON.stringify(json));
}

/**
 * Open an image from Hyperdrive and convert it to base64 data URL
 */
export const readAsDataURL = async (
	drive: Hyperdrive,
	path: string,
): Promise<string> => {
	const base64 = await drive
		.get(path)
		.then((buf: Uint8Array) => buf && b4a.toString(buf, 'base64'));

	const mimeType = mime.getType(path);

	return base64 && `data:${mimeType};base64,${base64}`;
};

/**
 * Checks if current versions for Profiles and Contacts hyperdrives are seeded by our server.
 */
export const checkBackup = async (
	slashtag: Slashtag,
): Promise<{
	profile: boolean;
	contacts: boolean;
}> => {
	const drives = [
		slashtag.drivestore.get(),
		slashtag.drivestore.get('contacts'),
	];

	const [profile, contacts] = await Promise.all(
		drives.map(async (drive) => {
			await drive.update();
			await drive.getBlobs();

			const lengths = [drive.core.length, drive.blobs.core.length];
			const keys = [
				b4a.toString(drive.key, 'hex'),
				b4a.toString(drive.blobs.core.key, 'hex'),
			];

			drive.close();

			try {
				const [c1, c2] = await Promise.all(
					keys.map(async (key) => {
						const res = await fetch(
							__SLASHTAGS_SEEDER_BASE_URL__ + '/seeding/hypercore/' + key,
							{ method: 'GET' },
						);
						const status = await res.json();

						return {
							seeded: status.statusCode !== 404,
							length: status.length ?? 0,
						};
					}),
				);

				return (
					c1.seeded &&
					c2.seeded &&
					c1.length === lengths[0] &&
					c2.length === lengths[1]
				);
			} catch (e) {
				console.log('seeder request error: ', e.message);
				return false;
			}
		}),
	);

	return {
		profile,
		contacts,
	};
};
