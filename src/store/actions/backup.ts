import actions from './actions';
import { err, ok, Result } from '@synonymdev/result';
import { getDispatch } from '../helpers';
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
import lm from '@synonymdev/react-native-ldk';
import { TAvailableNetworks } from '../../utils/networks';
import {
	ENetworks,
	TLdkData,
} from '@synonymdev/react-native-ldk/dist/utils/types';
import { getSelectedNetwork } from '../../utils/wallet';
import { ISettings } from '../types/settings';
import { updateSettings } from './settings';
import { IBackup, TAccountBackup } from '../types/backup';
import { IWidgetsStore } from '../types/widgets';
import { updateWidgets } from './widgets';
import { isObjPartialMatch } from '../../utils/helpers';
import { getDefaultSettingsShape } from '../shapes/settings';
import { getDefaultWidgetsShape } from '../shapes/widgets';

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
		},
	});

	return ok('Backup success');
};

export const performRemoteBackup = async <T>({
	slashtag,
	isSyncedKey,
	backupCategory,
	backup,
	selectedNetwork,
}: {
	slashtag: Slashtag;
	isSyncedKey: keyof IBackup;
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

	const backup: TAccountBackup<TLdkData> = JSON.parse(
		bytesToString(fetchRes.value.content),
	);

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

	const backup: T = JSON.parse(bytesToString(fetchRes.value.content));

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

	await updateSettings({
		...expectedBackupShape,
		...backup,
		biometrics: false,
		pin: false,
		pinForPayments: false,
		pinOnLaunch: false,
	});

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

	await updateWidgets({
		...expectedBackupShape,
		...backup,
		onboardedWidgets: true,
	});
	// Restore success
	return ok({ backupExists: true });
};

export const performFullRestoreFromLatestBackup = async (
	slashtag: Slashtag,
): Promise<Result<{ backupExists: boolean }>> => {
	try {
		const selectedNetwork = getSelectedNetwork();
		const ldkBackupRes = await performLdkRestore({ slashtag, selectedNetwork });
		if (ldkBackupRes.isErr()) {
			return err(ldkBackupRes.error.message);
		}

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

/*
 * This resets the backup store to defaultBackupShape
 */
export const resetBackupStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_BACKUP_STORE,
	});

	return ok('');
};
