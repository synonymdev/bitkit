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
import lm, { TAccountBackup } from '@synonymdev/react-native-ldk';
import { TAvailableNetworks } from '../../utils/networks';
import { ENetworks } from '@synonymdev/react-native-ldk/dist/utils/types';
import { getSelectedNetwork } from '../../utils/wallet';

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
	backup?: TAccountBackup,
): Promise<Result<string>> => {
	dispatch({
		type: actions.BACKUP_UPDATE,
		payload: { remoteLdkBackupSynced: false },
	});

	let ldkBackup: TAccountBackup;
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

export const performFullRestoreFromLatestBackup = async (
	slashtag: Slashtag,
): Promise<Result<string>> => {
	try {
		const selectedNetwork = getSelectedNetwork();

		const res = await listBackups(
			slashtag,
			EBackupCategories.ldkComplete,
			selectedNetwork,
		);
		if (res.isErr()) {
			return err(res.error);
		}

		if (res.value.length === 0) {
			return ok('No remote LDK backups found');
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

		const backup: TAccountBackup = JSON.parse(
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

		return ok('Restore success');
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
