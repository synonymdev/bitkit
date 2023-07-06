import { err, ok, Result } from '@synonymdev/result';
import lm, { ENetworks, TLdkData } from '@synonymdev/react-native-ldk';

import actions from './actions';
import { getBackupStore, getDispatch } from '../helpers';
import {
	EBackupCategories,
	fetchBackup,
	listBackups,
	uploadBackup,
} from '../../utils/backup/backpack';
import { bytesToString, stringToBytes } from '../../utils/converters';
import { Slashtag } from '../../hooks/slashtags';
import {
	exportBackup,
	setAccount,
	setLdkStoragePath,
} from '../../utils/lightning';
import { EAvailableNetworks, TAvailableNetworks } from '../../utils/networks';
import { getSelectedNetwork } from '../../utils/wallet';
import { ISettings } from '../types/settings';
import { updateSettings } from './settings';
import { IBackup, TAccountBackup } from '../types/backup';
import { isObjPartialMatch } from '../../utils/helpers';
import { IWidgetsStore } from '../types/widgets';
import { updateWidgets } from './widgets';
import { getDefaultSettingsShape } from '../shapes/settings';
import { getDefaultWidgetsShape } from '../shapes/widgets';
import { IMetadata } from '../types/metadata';
import { getDefaultMetadataShape } from '../shapes/metadata';
import { updateMetadata } from './metadata';
import { EActivityType } from '../types/activity';
import { addActivityItems } from './activity';
import { updateBlocktank } from './blocktank';
import { IBlocktank } from '../types/blocktank';
import { IActivity } from '../types/activity';
import { checkBackup } from '../../utils/slashtags';
import { showToast } from '../../utils/notifications';
import { FAILED_BACKUP_CHECK_TIME } from '../../utils/backup/backups-subscriber';
import i18n from '../../utils/i18n';

const dispatch = getDispatch();

/**
 * Triggers a full remote backup
 * @return {Promise<Result<string>>}
 */
export const performFullBackup = async (
	slashtag: Slashtag,
): Promise<Result<string>> => {
	const ldkRemoteRes = await performRemoteLdkBackup(slashtag);
	//TODO perform other backup types

	//TODO(slashtags): Send all drives (public + contacts) to the seeding server.

	//TODO check results of each time and return errors if any

	if (ldkRemoteRes.isErr()) {
		return err(ldkRemoteRes.error);
	}

	return ok('Backup success');
};

export const performRemoteLdkBackup = async (
	slashtag: Slashtag,
	backup?: TAccountBackup<TLdkData>,
): Promise<Result<string>> => {
	dispatch({
		type: actions.BACKUP_UPDATE,
		payload: { remoteLdkBackupSynced: false },
	});

	let ldkBackup: TAccountBackup<TLdkData>;
	//Automated backup events pass the latest state through
	if (backup) {
		ldkBackup = backup;
	} else {
		const res = await exportBackup();
		if (res.isErr()) {
			return err(res.error);
		}

		ldkBackup = res.value;
	}

	//Translate LDK type to our wallet type
	let network: TAvailableNetworks = 'bitcoin';
	switch (ldkBackup.network) {
		case ENetworks.regtest: {
			network = 'bitcoinRegtest';
			break;
		}
		case ENetworks.testnet: {
			network = 'bitcoinTestnet';
			break;
		}
		case ENetworks.mainnet: {
			network = 'bitcoin';
			break;
		}
	}

	const res = await uploadBackup(
		slashtag,
		stringToBytes(JSON.stringify(backup)),
		EBackupCategories.ldkComplete,
		network,
	);

	if (res.isErr()) {
		return err(res.error);
	}

	dispatch({
		type: actions.BACKUP_UPDATE,
		payload: {
			remoteLdkBackupSynced: true,
			remoteLdkBackupLastSync: new Date().getTime(),
			remoteLdkBackupLastSyncRequired: undefined,
		},
	});

	return ok('Backup success');
};

export const performRemoteBackup = async <T>({
	slashtag,
	isSyncedKey,
	syncRequiredKey,
	syncCompletedKey,
	backupCategory,
	backup,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	isSyncedKey: keyof IBackup;
	syncRequiredKey: keyof IBackup;
	syncCompletedKey: keyof IBackup;
	backupCategory: EBackupCategories;
	backup?: T;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	//Automated backup events pass the latest state through
	if (!backup) {
		return ok('Nothing to backup.');
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const res = await uploadBackup(
		slashtag,
		stringToBytes(JSON.stringify(backup)),
		backupCategory,
		selectedNetwork,
	);

	if (res.isErr()) {
		return err(res.error);
	}

	dispatch({
		type: actions.BACKUP_UPDATE,
		payload: {
			[isSyncedKey]: true,
			[syncRequiredKey]: undefined,
			[syncCompletedKey]: new Date().getTime(),
		},
	});

	return ok('Backup success');
};

export const performLdkRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const res = await listBackups(
		slashtag,
		EBackupCategories.ldkComplete,
		selectedNetwork,
	);
	if (res.isErr()) {
		return err(res.error);
	}

	// No backup exists for the provided slashtag.
	if (res.value.length === 0) {
		return ok({ backupExists: false });
	}

	const fetchRes = await fetchBackup(
		slashtag,
		res.value[0].timestamp,
		EBackupCategories.ldkComplete,
		selectedNetwork,
	);
	if (fetchRes.isErr()) {
		return err(fetchRes.error);
	}

	const storageRes = await setLdkStoragePath();
	if (storageRes.isErr()) {
		return err(storageRes.error);
	}

	const bytesToStringRes = bytesToString(fetchRes.value.content);
	if (bytesToStringRes.isErr()) {
		return err(bytesToStringRes.error);
	}
	const backup: TAccountBackup<TLdkData> = JSON.parse(bytesToStringRes.value);

	//TODO add "sweepChannelsOnStartup: true" when lib has been updated
	const importRes = await lm.importAccount({
		backup,
	});
	if (importRes.isErr()) {
		return err(importRes.error);
	}

	await setAccount({ name: backup.account.name, seed: backup.account.seed });
	// Restore success
	return ok({ backupExists: true });
};

/**
 * Retrieves the backup data for the provided backupCategory.
 * @param {Slashtag} slashtag
 * @param {EBackupCategories} backupCategory
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<Result<T | undefined>>}
 */
export const getBackup = async <T>({
	slashtag,
	backupCategory,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	backupCategory: EBackupCategories;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<T | undefined>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const res = await listBackups(slashtag, backupCategory, selectedNetwork);
	if (res.isErr()) {
		return err(res.error);
	}

	// No backup exists for the provided slashtag.
	if (res.value.length === 0) {
		return ok(undefined);
	}

	const fetchRes = await fetchBackup(
		slashtag,
		res.value[0].timestamp,
		backupCategory,
		selectedNetwork,
	);
	if (fetchRes.isErr()) {
		return err(fetchRes.error);
	}

	const bytesToStringRes = bytesToString(fetchRes.value.content);
	if (bytesToStringRes.isErr()) {
		return err(bytesToStringRes.error);
	}
	const backup: T = JSON.parse(bytesToStringRes.value);

	// Restore success
	return ok(backup);
};

export const performSettingsRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<ISettings>({
		slashtag,
		backupCategory: EBackupCategories.settings,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;
	if (!backup) {
		return ok({ backupExists: false });
	}

	const expectedBackupShape = getDefaultSettingsShape();
	//If the keys in the backup object are not found in the reference object assume the backup does not exist.
	if (!isObjPartialMatch(backup, expectedBackupShape)) {
		return ok({ backupExists: false });
	}

	updateSettings({
		...expectedBackupShape,
		...backup,
		biometrics: false,
		pin: false,
		pinForPayments: false,
		pinOnLaunch: true,
	});
	updateBackup({ remoteSettingsBackupSynced: true });

	// Restore success
	return ok({ backupExists: true });
};

export const performWidgetsRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const backupRes = await getBackup<IWidgetsStore>({
		slashtag,
		backupCategory: EBackupCategories.widgets,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;
	if (!backup) {
		return ok({ backupExists: false });
	}

	const expectedBackupShape = getDefaultWidgetsShape();
	//If the keys in the backup object are not found in the reference object assume the backup does not exist.
	if (!isObjPartialMatch(backup, expectedBackupShape, ['widgets'])) {
		return ok({ backupExists: false });
	}

	updateWidgets({
		...expectedBackupShape,
		...backup,
		onboardedWidgets: true,
	});
	updateBackup({ remoteWidgetsBackupSynced: true });

	// Restore success
	return ok({ backupExists: true });
};

export const performMetadataRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<IMetadata>({
		slashtag,
		backupCategory: EBackupCategories.metadata,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;

	if (!backup) {
		return ok({ backupExists: false });
	}

	const expectedBackupShape = getDefaultMetadataShape();
	//If the keys in the backup object are not found in the reference object assume the backup does not exist.
	if (
		!isObjPartialMatch(backup, expectedBackupShape, [
			'tags',
			'pendingTags',
			'slashTagsUrls',
		])
	) {
		return ok({ backupExists: false });
	}

	updateMetadata({
		...expectedBackupShape,
		...backup,
	});
	updateBackup({ remoteMetadataBackupSynced: true });

	// Restore success
	return ok({ backupExists: true });
};

export const performLdkActivityRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<IActivity['items']>({
		slashtag,
		backupCategory: EBackupCategories.ldkActivity,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;

	if (!backup) {
		return ok({ backupExists: false });
	}

	if (
		!(
			Array.isArray(backup) &&
			backup.every((i) => i.activityType === EActivityType.lightning)
		)
	) {
		return ok({ backupExists: false });
	}

	addActivityItems(backup);
	updateBackup({ remoteLdkActivityBackupSynced: true });

	// Restore success
	return ok({ backupExists: true });
};

export const performBlocktankRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<Partial<IBlocktank>>({
		slashtag,
		backupCategory: EBackupCategories.blocktank,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;

	if (!backup) {
		return ok({ backupExists: false });
	}

	if (!('orders' in backup && 'paidOrders' in backup)) {
		return ok({ backupExists: false });
	}

	updateBlocktank(backup);
	updateBackup({ remoteLdkActivityBackupSynced: true });

	// Restore success
	return ok({ backupExists: true });
};

export const performFullRestoreFromLatestBackup = async (
	slashtag: Slashtag,
): Promise<Result<{ backupExists: boolean }>> => {
	try {
		// ldk restore should be perfomed for all networks
		for (const network of Object.values(EAvailableNetworks)) {
			const ldkBackupRes = await performLdkRestore({
				slashtag,
				selectedNetwork: network,
			});
			if (ldkBackupRes.isErr()) {
				return err(ldkBackupRes.error.message);
			}
		}

		const selectedNetwork = getSelectedNetwork();

		const settingsBackupRes = await performSettingsRestore({
			slashtag,
			selectedNetwork,
		});
		if (settingsBackupRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up settings', settingsBackupRes.error.message);
		}

		const widgetsBackupRes = await performWidgetsRestore({
			slashtag,
			selectedNetwork,
		});
		if (widgetsBackupRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up widgets', widgetsBackupRes.error.message);
		}

		const metadataBackupRes = await performMetadataRestore({
			slashtag,
			selectedNetwork,
		});
		if (metadataBackupRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up metadata', metadataBackupRes.error.message);
		}

		const ldkActivityRes = await performLdkActivityRestore({
			slashtag,
			selectedNetwork,
		});
		if (ldkActivityRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up ldkActivity', ldkActivityRes.error.message);
		}

		const btBackupRes = await performBlocktankRestore({
			slashtag,
			selectedNetwork,
		});
		if (btBackupRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up blocktank', btBackupRes.error.message);
		}

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

export const setRemoteBackupsEnabled = (
	remoteBackupsEnabled: boolean,
): void => {
	dispatch({
		type: actions.BACKUP_UPDATE,
		payload: {
			remoteBackupsEnabled,
			remoteLdkBackupLastSync: undefined,
		},
	});
};

export const checkProfileAndContanctsBackup = async (
	slashtag: Slashtag,
): Promise<void> => {
	dispatch({ type: actions.BACKUP_SEEDER_CHECK_START });
	const payload = await checkBackup(slashtag);
	dispatch({ type: actions.BACKUP_SEEDER_CHECK_END, payload });

	// now check if backup is too old and show warning if it is
	const now = new Date().getTime();
	const backup = getBackupStore();
	if (
		(backup.hyperProfileCheckRequested &&
			now - backup.hyperProfileCheckRequested > FAILED_BACKUP_CHECK_TIME) ||
		(backup.hyperContactsCheckRequested &&
			now - backup.hyperContactsCheckRequested > FAILED_BACKUP_CHECK_TIME)
	) {
		showToast({
			type: 'error',
			title: i18n.t('settings:backup.failed_title'),
			description: i18n.t('settings:backup.failed_message'),
		});
	}
};

/*
 * This resets the backup store to defaultBackupShape
 */
export const resetBackupStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_BACKUP_STORE,
	});

	return ok('');
};

export const updateBackup = (payload: Partial<IBackup>): Result<string> => {
	dispatch({
		type: actions.BACKUP_UPDATE,
		payload,
	});
	return ok('');
};
