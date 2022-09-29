import { SDK, SlashURL, Slashtag, Hyperdrive } from '@synonymdev/slashtags-sdk';
import c from 'compact-encoding';
import b4a from 'b4a';

import { navigate } from '../../navigation/root/RootNavigator';
import { BasicProfile, SlashPayConfig } from '../../store/types/slashtags';
import { showErrorNotification } from '../notifications';
import { getReceiveAddress } from '../../utils/wallet';
import { createLightningInvoice } from '../../utils/lightning';
import { getStore } from '../../store/helpers';

/**
 * Handles pasting or scanning a slash:// url
 */
export const handleSlashtagURL = (
	url: string,
	onError: (error: Error) => void = (): void => {},
): void => {
	try {
		// Validate URL
		const parsed = SlashURL.parse(url);

		if (parsed.protocol === 'slash:') {
			navigate('ContactEdit', { url });
		}
	} catch (error) {
		onError(error as Error);
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
	const id = SlashURL.parse(url).id;
	await drive?.put('/' + id, c.encode(c.json, record)).catch((error: Error) =>
		showErrorNotification({
			title: 'Error while saving contact: ',
			message: error.message,
		}),
	);
	closeDriveSession(drive);
};

export const saveProfile = async (
	slashtag: Slashtag,
	profile: BasicProfile,
): Promise<void> => {
	if (checkClosed(slashtag)) {
		return;
	}

	const drive = slashtag?.drivestore.get();
	await drive
		.put('/profile.json', c.encode(c.json, profile))
		.catch((error: Error) =>
			showErrorNotification({
				title: 'Error while saving profile: ',
				message: error.message,
			}),
		);

	closeDriveSession(drive);
};

/**
 * Deletes a contact from the 'contacts' SlashDrive
 */
// TODO(slashtags): should we add a slasthag.deleteContact()?
export const deleteContact = async (
	slashtag: Slashtag,
	url: string,
): Promise<any> => {
	if (checkClosed(slashtag)) {
		return;
	}

	const drive = await slashtag.drivestore.get('contacts');
	const id = SlashURL.parse(url).id;
	await drive.del('/' + id).catch((error: Error) =>
		showErrorNotification({
			title: 'Error while deleting contact: ',
			message: error.message,
		}),
	);

	closeDriveSession(drive);
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
			const id = SlashURL.parse(url).id;
			return batch?.put('/' + id, c.encode(c.json, { name }));
		}),
	);
	await batch.flush();
	console.debug('Done saving bulk contacts');
	closeDriveSession(drive);
};

export const onSDKError = (error: Error): void => {
	// TODO (slashtags) move this error management to the SDK
	if (error.message.endsWith('Connection refused')) {
		error = new Error("Couldn't connect to the provided DHT relay");
	}

	showErrorNotification({
		title: 'SlashtagsProvider Error',
		message: error.message,
	});
};

/** Update slashpay.json */
export const updateSlashPayConfig = async (
	sdk: SDK,
	options: {
		/** Offline payments */
		p2wpkh?: boolean;
		expiryDeltaSeconds?: number;
		lightningInvoiceDescription?: string;
		lightningInvoiceSats?: number;
	},
): Promise<{
	updated: boolean;
	payConfig: SlashPayConfig;
}> => {
	if (sdk.closed) {
		console.debug('updateSlashPayConfig: SKIP sdk is closed');
		return { updated: false, payConfig: [] };
	}

	const slashtag = getSelectedSlashtag(sdk);
	const drive = slashtag.drivestore.get();

	const payConfig: SlashPayConfig = [];

	{
		// LN invoice first to prefer it over onchain, if possible.
		const response = await createLightningInvoice({
			amountSats: options.lightningInvoiceSats || 0,
			description: options?.lightningInvoiceDescription || '',
			expiryDeltaSeconds: options.expiryDeltaSeconds || 60 * 60 * 24 * 7, //Should be rather high (Days or Weeks).
		});

		if (response.isOk()) {
			payConfig.push({
				type: 'lightningInvoice',
				value: response.value.to_str,
			});
		}
	}

	if (options.p2wpkh) {
		const selectedWallet = getStore().wallet.selectedWallet;
		const response = getReceiveAddress({ selectedWallet });
		if (response.isOk()) {
			payConfig.push({ type: 'p2wpkh', value: response.value });
		}
	}

	await drive
		.put('/slashpay.json', c.encode(c.json, payConfig))
		.then(() => {
			console.debug('Updated slashpay.json:', payConfig);
		})
		.catch(noop);

	closeDriveSession(drive);

	return {
		updated: true,
		/** Saved config */
		payConfig,
	};
};

/** Send hypercorse to seeder */
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
				'http://35.233.47.252:443/seeding/hypercore',
				{
					method: 'POST',
					body: JSON.stringify({ publicKey: keys[0] }),
					headers: { 'Content-Type': 'application/json' },
				},
			);

			const secondResponse = await fetch(
				'http://35.233.47.252:443/seeding/hypercore',
				{
					method: 'POST',
					body: JSON.stringify({ publicKey: keys[1] }),
					headers: { 'Content-Type': 'application/json' },
				},
			);

			closeDriveSession(drive);
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

	const drive = sdk.drive(SlashURL.parse(url).key);
	await drive.ready().catch(noop);
	const payConfig =
		(await drive
			.get('/slashpay.json')
			.then((buf: Uint8Array) => buf && c.decode(c.json, buf))
			.catch(noop)) || [];

	closeDriveSession(drive);
	return payConfig;
};

/**
 * unlike drive.close() this function will only gc session but not close the first hypercore
 * avoids errors trying to create a session from a closed hypercore
 * TODO (slashtags) investigate how to handle this at the SDK level instead
 * try to replicate it in a failing test and figure out sensible defaults.
 **/
export const closeDriveSession = (drive: Hyperdrive): void => {
	drive
		.ready()
		.then(async () => {
			const core = drive.core;

			core.autoClose = false;
			await core.close();

			const blobsCore = drive.blobs?.core;
			if (blobsCore) {
				blobsCore.autoClose = false;
				await blobsCore.close();
			}

			// Uncomment next line to debug if you got an error: Cannot make sessions on a closing core
			// console.debug("Remaining sessions", drive.core.sessions.length, drive.blobs.core.sessions.length)
		})
		.catch(noop);
};

function noop(): void {}

function checkClosed(slashtag: Slashtag): boolean {
	if (slashtag.drivestore.closed) {
		showErrorNotification({
			title: 'SDK is closed',
			message: 'please restart Bitkit!',
		});
		return true;
	} else {
		return false;
	}
}

export const validateSlashtagURL = (url: string): boolean => {
	try {
		const parsed = SlashURL.parse(url);
		if (parsed.protocol === 'slash:') {
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
};
