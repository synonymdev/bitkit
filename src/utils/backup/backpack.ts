import BackupProtocol from 'backpack-client/src/backup-protocol.js';
import { ok, err, Result } from '@synonymdev/result';
import { Slashtag } from '@synonymdev/slashtags-sdk';

import { EAvailableNetwork } from '../networks';
import {
	__BACKUPS_SERVER_SLASHTAG__,
	__BACKUPS_SHARED_SECRET__,
} from '../../constants/env';

const categoryWithNetwork = (
	category: EBackupCategoriesOld,
	network: EAvailableNetwork,
): string => `${category}.${network}`.toLowerCase();

export enum EBackupCategoriesOld {
	jest = 'bitkit.jest',
	transactions = 'bitkit.transactions',
	ldkComplete = 'bitkit.ldk.complete',
	ldkActivity = 'bitkit.ldk.activity',
	settings = 'bitkit.settings',
	widgets = 'bitkit.widgets',
	metadata = 'bitkit.metadata',
	blocktank = 'bitkit.blocktank',
	slashtags = 'bitkit.slashtags',
}

//Keep a cached backup instance for each slashtag
const backupsInstances: { [key: string]: BackupProtocol } = {};
const backupsFactory = async (slashtag: Slashtag): Promise<BackupProtocol> => {
	if (!__BACKUPS_SHARED_SECRET__ || !__BACKUPS_SERVER_SLASHTAG__) {
		const error =
			'Missing env fields BACKUPS_SHARED_SECRET and BACKUPS_SERVER_SLASHTAG';
		console.error(error);
		throw new Error(error);
	}

	const key = slashtag.keyPair!.publicKey.toString();
	if (!backupsInstances[key]) {
		backupsInstances[key] = new BackupProtocol(slashtag);

		// Give the protocol the shared secret
		backupsInstances[key].setSecret(__BACKUPS_SHARED_SECRET__);
	}

	return backupsInstances[key];
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
 * @param {Slashtag} slashtag
 * @param {number} timestamp
 * @param {EBackupCategoriesOld} category
 * @param {EAvailableNetwork} network
 * @returns {Promise<Result<TFetchResult>>}
 */
export const fetchBackup = async (
	slashtag: Slashtag,
	timestamp: number,
	category: EBackupCategoriesOld,
	network: EAvailableNetwork,
): Promise<Result<TFetchResult>> => {
	try {
		const backups = await backupsFactory(slashtag);

		const { error, results, success } = await backups.restoreData(
			__BACKUPS_SERVER_SLASHTAG__,
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
 * Returns list of backups in order of newest to oldest
 * @param {Slashtag} slashtag
 * @param {EBackupCategoriesOld} category
 * @param {EAvailableNetwork} network
 * @returns {Promise<Result<{ timestamp: number }[]>>}
 */
export const listBackups = async (
	slashtag: Slashtag,
	category: EBackupCategoriesOld,
	network: EAvailableNetwork,
): Promise<Result<{ timestamp: number }[]>> => {
	try {
		const backups = await backupsFactory(slashtag);

		const { error, results, success } = await backups.getRecentBackups(
			__BACKUPS_SERVER_SLASHTAG__,
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
