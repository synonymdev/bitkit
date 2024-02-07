import { err, ok, Result } from '@synonymdev/result';
import lm, { ldk, ENetworks, TLdkData } from '@synonymdev/react-native-ldk';

import { getBackupStore, dispatch } from '../helpers';
import {
	EBackupCategories,
	fetchBackup,
	listBackups,
	uploadBackup,
} from '../../utils/backup/backpack';
import { bytesToString, stringToBytes } from '../../utils/converters';
import { Slashtag } from '../../hooks/slashtags';
import {
	checkAccountVersion,
	exportBackup,
	getLdkAccount,
	setAccount,
	setLdkStoragePath,
} from '../../utils/lightning';
import { EAvailableNetwork } from '../../utils/networks';
import { getSelectedNetwork } from '../../utils/wallet';
import { TBackupState, TAccountBackup } from '../types/backup';
import { isObjPartialMatch } from '../../utils/helpers';
import { getDefaultSettingsShape } from '../shapes/settings';
import { addActivityItems, TActivity } from '../slices/activity';
import { initialMetadataState, updateMetadata } from '../slices/metadata';
import { updateSettings, TSettings } from '../slices/settings';
import {
	updateWidgets,
	initialWidgetsState,
	TWidgetsState,
} from '../slices/widgets';
import { updateBlocktank } from '../slices/blocktank';
import { addContacts } from '../slices/slashtags';
import { EActivityType } from '../types/activity';
import { IBlocktank } from '../types/blocktank';
import { TMetadataState } from '../types/metadata';
import { checkBackup } from '../../utils/slashtags';
import { showToast } from '../../utils/notifications';
import { FAILED_BACKUP_CHECK_TIME } from '../../utils/backup/backups-subscriber';
import i18n from '../../utils/i18n';
import { EUnit } from '../types/wallet';
import { TSlashtagsState } from '../types/slashtags';
import {
	__BACKUPS_SERVER_HOST__,
	__BACKUPS_SERVER_PUBKEY__,
} from '../../constants/env';
import {
	endBackupSeederCheck,
	startBackupSeederCheck,
	updateBackup,
} from '../slices/backup';

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
	dispatch(updateBackup({ remoteLdkBackupSynced: false }));

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
	let network = EAvailableNetwork.bitcoin;
	switch (ldkBackup.network) {
		case ENetworks.regtest: {
			network = EAvailableNetwork.bitcoinRegtest;
			break;
		}
		case ENetworks.testnet: {
			network = EAvailableNetwork.bitcoinTestnet;
			break;
		}
		case ENetworks.mainnet: {
			network = EAvailableNetwork.bitcoin;
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

	dispatch(
		updateBackup({
			remoteLdkBackupSynced: true,
			remoteLdkBackupLastSync: new Date().getTime(),
			remoteLdkBackupLastSyncRequired: undefined,
		}),
	);

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
	isSyncedKey: keyof TBackupState;
	syncRequiredKey: keyof TBackupState;
	syncCompletedKey: keyof TBackupState;
	backupCategory: EBackupCategories;
	backup?: T;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	//Automated backup events pass the latest state through
	if (!backup) {
		return ok('Nothing to backup.');
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupJson = JSON.stringify(backup);
	const bytes = stringToBytes(backupJson);

	const res = await uploadBackup(
		slashtag,
		bytes,
		backupCategory,
		selectedNetwork,
	);

	if (res.isErr()) {
		return err(res.error);
	}

	dispatch(
		updateBackup({
			[isSyncedKey]: true,
			[syncRequiredKey]: undefined,
			[syncCompletedKey]: new Date().getTime(),
		}),
	);

	return ok('Backup success');
};

export const performLdkRestore = async ({
	selectedNetwork,
}: {
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const storageRes = await setLdkStoragePath();
	if (storageRes.isErr()) {
		return err(storageRes.error);
	}

	const version = await checkAccountVersion();
	const lightningAccount = await getLdkAccount({ selectedNetwork, version });
	if (lightningAccount.isErr()) {
		return err(lightningAccount.error);
	}

	let network: ENetworks;
	switch (selectedNetwork) {
		case 'bitcoin':
			network = ENetworks.mainnet;
			break;
		case 'bitcoinTestnet':
			network = ENetworks.testnet;
			break;
		default:
			network = ENetworks.regtest;
			break;
	}

	const backupServerDetails = {
		host: __BACKUPS_SERVER_HOST__,
		serverPubKey: __BACKUPS_SERVER_PUBKEY__,
	};
	const backupSetupRes = await ldk.backupSetup({
		seed: lightningAccount.value.seed,
		network,
		details: backupServerDetails,
	});

	if (backupSetupRes.isErr()) {
		return err(backupSetupRes.error);
	}

	//Check if backup exists on new server
	const fileListRes = await ldk.backupListFiles();
	if (fileListRes.isErr()) {
		return err(fileListRes.error);
	}

	const fileList = fileListRes.value;
	const backupExists =
		fileList.list.length > 0 || fileList.channel_monitors.length > 0;
	if (!backupExists) {
		return ok({ backupExists });
	}

	//If exists just restore it
	const restoreRes = await lm.restoreFromRemoteServer({
		account: lightningAccount.value,
		serverDetails: backupServerDetails,
		network,
		overwrite: true,
	});

	if (restoreRes.isErr()) {
		return err(restoreRes.error);
	}

	//If not exists, check if there is a backup on the old server
	return ok({ backupExists });
};

export const performLdkRestoreDeprecated = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	console.warn(`Restoring ${selectedNetwork} from deprecated backup server.`);
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

	const jsonString = bytesToString(fetchRes.value.content);
	const backup: TAccountBackup<TLdkData> = JSON.parse(jsonString);

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
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<T | undefined>>}
 */
export const getBackup = async <T>({
	slashtag,
	backupCategory,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	backupCategory: EBackupCategories;
	selectedNetwork?: EAvailableNetwork;
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

	let jsonString = bytesToString(fetchRes.value.content);

	if (
		backupCategory === EBackupCategories.ldkActivity ||
		backupCategory === EBackupCategories.metadata
	) {
		// Remove previously incorrectly encoded emojis from the backup
		// eslint-disable-next-line no-control-regex
		jsonString = jsonString.replace(/([\u0000-\u001F])/g, '');
	}

	const backup: T = JSON.parse(jsonString);

	// Restore success
	return ok(backup);
};

export const performSettingsRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<TSettings>({
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

	dispatch(
		updateSettings({
			...expectedBackupShape,
			...backup,
			// @ts-ignore migrate unit
			unit: backup.unit === 'satoshi' ? EUnit.BTC : backup.unit,
			biometrics: false,
			pin: false,
			pinForPayments: false,
			pinOnLaunch: true,
		}),
	);
	dispatch(updateBackup({ remoteSettingsBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performWidgetsRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const backupRes = await getBackup<TWidgetsState>({
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

	const expectedBackupShape = initialWidgetsState;
	//If the keys in the backup object are not found in the reference object assume the backup does not exist.
	if (!isObjPartialMatch(backup, expectedBackupShape, ['widgets'])) {
		return ok({ backupExists: false });
	}

	dispatch(
		updateWidgets({
			...expectedBackupShape,
			...backup,
			onboardedWidgets: true,
		}),
	);
	dispatch(updateBackup({ remoteWidgetsBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performMetadataRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<TMetadataState>({
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

	const expectedBackupShape = initialMetadataState;
	//If the keys in the backup object are not found in the reference object assume the backup does not exist.
	if (
		!isObjPartialMatch(backup, expectedBackupShape, ['tags', 'slashTagsUrls'])
	) {
		return ok({ backupExists: false });
	}

	dispatch(updateMetadata({ ...expectedBackupShape, ...backup }));
	dispatch(updateBackup({ remoteMetadataBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performLdkActivityRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<TActivity['items']>({
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

	dispatch(addActivityItems(backup));
	dispatch(updateBackup({ remoteLdkActivityBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performBlocktankRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
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

	dispatch(updateBlocktank(backup));
	dispatch(updateBackup({ remoteBlocktankBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performSlashtagsRestore = async ({
	slashtag,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const backupRes = await getBackup<Partial<TSlashtagsState>>({
		slashtag,
		backupCategory: EBackupCategories.slashtags,
		selectedNetwork,
	});
	if (backupRes.isErr()) {
		return err(backupRes.error.message);
	}

	const backup = backupRes.value;

	if (!backup) {
		return ok({ backupExists: false });
	}

	if (!('contacts' in backup)) {
		return ok({ backupExists: false });
	}

	dispatch(addContacts(backup.contacts!));
	dispatch(updateBackup({ remoteSlashtagsBackupSynced: true }));

	// Restore success
	return ok({ backupExists: true });
};

export const performFullRestoreFromLatestBackup = async (
	slashtag: Slashtag,
): Promise<Result<{ backupExists: boolean }>> => {
	try {
		// ldk restore should be performed for all networks
		for (const network of Object.values(EAvailableNetwork)) {
			const ldkBackupRes = await performLdkRestore({
				selectedNetwork: network,
			});
			if (ldkBackupRes.isErr()) {
				return err(ldkBackupRes.error.message);
			}

			//No backup found on new server, try deprecated backup server
			if (!ldkBackupRes.value.backupExists) {
				const ldkBackupDeprecatedRes = await performLdkRestoreDeprecated({
					slashtag,
					selectedNetwork: network,
				});

				if (ldkBackupDeprecatedRes.isErr()) {
					return err(ldkBackupDeprecatedRes.error.message);
				}
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

		const slashBackupRes = await performSlashtagsRestore({
			slashtag,
			selectedNetwork,
		});
		if (slashBackupRes.isErr()) {
			//Since this backup feature is not critical and mostly for user convenience there's no reason to throw an error here.
			console.log('Error backing up contacts', slashBackupRes.error.message);
		}

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

export const checkProfileAndContactsBackup = async (
	slashtag: Slashtag,
): Promise<void> => {
	dispatch(startBackupSeederCheck());
	const payload = await checkBackup(slashtag);
	dispatch(endBackupSeederCheck(payload));

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
