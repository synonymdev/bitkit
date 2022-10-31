import BackupProtocol from 'backpack-client/src/backup-protocol.js';
import { ok, err, Result } from '@synonymdev/result';
import { Slashtag } from '@synonymdev/slashtags-sdk';
import { BACKUPS_SHARED_SECRET, BACKUPS_SERVER_SLASHTAG } from '@env';

import { name as appName, version as appVersion } from '../../../package.json';
import { TAvailableNetworks } from '../networks';

const categoryWithNetwork = (
	category: EBackupCategories,
	network: TAvailableNetworks,
): string => `${category}.${network}`.toLowerCase();

export enum EBackupCategories {
	jest = 'bitkit.jest',
	transactions = 'bitkit.transactions',
	ldkComplete = 'bitkit.ldk.complete',
}

//Keep a cached backup instance for each slashtag
const backupsInstances: { [key: string]: BackupProtocol } = {};
const backupsFactory = async (slashtag: Slashtag): Promise<BackupProtocol> => {
	if (!BACKUPS_SHARED_SECRET || !BACKUPS_SERVER_SLASHTAG) {
		const error =
			'Missing env fields BACKUPS_SHARED_SECRET and BACKUPS_SERVER_SLASHTAG';
		console.error(error);
		throw new Error(error);
	}

	const key = slashtag.keyPair!.publicKey.toString();
	if (!backupsInstances[key]) {
		backupsInstances[key] = new BackupProtocol(slashtag);

		// Give the protocol the shared secret
		backupsInstances[key].setSecret(BACKUPS_SHARED_SECRET);
	}

	return backupsInstances[key];
};

/**
 * Uploads a backup to the server
 * @param slashtag
 * @param content
 * @param category
 * @returns {Promise<Ok<*> | Err<unknown>>}
 */
export const uploadBackup = async (
	slashtag: Slashtag,
	content: Uint8Array,
	category: EBackupCategories,
	network: TAvailableNetworks,
): Promise<Result<number>> => {
	try {
		const backups = await backupsFactory(slashtag);

		const encryptedContent = backups.encrypt(content, slashtag.key);

		// Prepare some data to back up
		const data = {
			appName,
			appVersion,
			category: categoryWithNetwork(category, network),
			content: encryptedContent,
		};

		const { error, results, success } = await backups.backupData(
			BACKUPS_SERVER_SLASHTAG,
			data,
		);

		if (!success) {
			return err(error);
		}

		const { timestamp } = results;

		return ok(timestamp);
	} catch (e) {
		return err(e);
	}
};

type TFetchResult = {
	appName: string;
	appVersion: string;
	category: string;
	content: Uint8Array;
	timestamp: number;
};

/**
 * Fetches a backup from the server
 * @param slashtag
 * @param timestamp
 * @param category
 * @returns {Promise<Ok<any> | Err<unknown>>}
 */
export const fetchBackup = async (
	slashtag: Slashtag,
	timestamp: number,
	category: EBackupCategories,
	network: TAvailableNetworks,
): Promise<Result<TFetchResult>> => {
	try {
		const backups = await backupsFactory(slashtag);

		const { error, results, success } = await backups.restoreData(
			BACKUPS_SERVER_SLASHTAG,
			{
				category: categoryWithNetwork(category, network),
				timestamp,
			},
		);

		if (!success) {
			return err(error);
		}

		const decryptedContent = backups.decrypt(results.content, slashtag.key);

		return ok({ ...results, content: decryptedContent });
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns list of backups in order of newest to olders
 * @param slashtag
 * @param category
 * @returns {Promise<Result<{ timestamp: number }[]>>}
 */
export const listBackups = async (
	slashtag: Slashtag,
	category: EBackupCategories,
	network: TAvailableNetworks,
): Promise<Result<{ timestamp: number }[]>> => {
	try {
		const backups = await backupsFactory(slashtag);

		const { error, results, success } = await backups.getRecentBackups(
			BACKUPS_SERVER_SLASHTAG,
			{
				category: categoryWithNetwork(category, network),
			},
		);

		if (!success) {
			return err(error);
		}

		const sorted = results.backups;

		sorted.sort((a, b) => {
			return b.timestamp - a.timestamp;
		});

		return ok(sorted);
	} catch (e) {
		return err(e);
	}
};
