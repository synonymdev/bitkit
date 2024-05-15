import lm, {
	ENetworks,
	ldk,
	TBackupServerDetails,
} from '@synonymdev/react-native-ldk';
import { err, ok, Result } from '@synonymdev/result';

import {
	__BACKUPS_SERVER_HOST__,
	__BACKUPS_SERVER_PUBKEY__,
} from '../../constants/env';
import { isObjPartialMatch } from '../../utils/helpers';
import { getLdkAccount, setLdkStoragePath } from '../../utils/lightning';
import { EAvailableNetwork } from '../../utils/networks';
import { getSelectedNetwork } from '../../utils/wallet';
import {
	dispatch,
	getActivityStore,
	getBlocktankStore,
	getMetaDataStore,
	getSettingsStore,
	getSlashtagsStore,
	getStore,
	getWidgetsStore,
} from '../helpers';
import { getDefaultSettingsShape } from '../shapes/settings';
import { addActivityItems, TActivity } from '../slices/activity';
import { backupError, backupStart, backupSuccess } from '../slices/backup';
import { updateBlocktank } from '../slices/blocktank';
import { initialMetadataState, updateMetadata } from '../slices/metadata';
import { TSettings, updateSettings } from '../slices/settings';
import { addContacts } from '../slices/slashtags';
import {
	initialWidgetsState,
	TWidgetsState,
	updateWidgets,
} from '../slices/widgets';
import { EActivityType } from '../types/activity';
import { TBackupMetadata } from '../types/backup';
import { IBlocktank } from '../types/blocktank';
import { TMetadataState } from '../types/metadata';
import { TSlashtagsState } from '../types/slashtags';
import { EUnit } from '../types/wallet';

export enum EBackupCategories {
	settings = 'bitkit_settings',
	widgets = 'bitkit_widgets',
	metadata = 'bitkit_metadata',
	blocktank = 'bitkit_blocktank_orders',
	slashtags = 'bitkit_slashtags_contacts',
	ldkActivity = 'bitkit_lightning_activity',
}

export const performLdkRestore = async ({
	backupServerDetails,
	selectedNetwork = getSelectedNetwork(),
}: {
	backupServerDetails: TBackupServerDetails;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<{ backupExists: boolean }>> => {
	const storageRes = await setLdkStoragePath();
	if (storageRes.isErr()) {
		return err(storageRes.error);
	}

	const lightningAccount = await getLdkAccount({ selectedNetwork });
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

export const performFullRestoreFromLatestBackup = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupServerDetails = {
			host: __BACKUPS_SERVER_HOST__,
			serverPubKey: __BACKUPS_SERVER_PUBKEY__,
		};

		// ldk restore should be performed for all networks
		for (const network of Object.values(EAvailableNetwork)) {
			const ldkBackupRes = await performLdkRestore({
				backupServerDetails,
				selectedNetwork: network,
			});
			if (ldkBackupRes.isErr()) {
				return err(ldkBackupRes.error.message);
			}
		}

		// reset backup settings once again before restoring all other backups
		const selectedNetwork = getSelectedNetwork();
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
		const lightningAccount = await getLdkAccount({ selectedNetwork });
		if (lightningAccount.isErr()) {
			return err(lightningAccount.error);
		}
		const backupSetupRes = await ldk.backupSetup({
			seed: lightningAccount.value.seed,
			network,
			details: backupServerDetails,
		});

		if (backupSetupRes.isErr()) {
			return err(backupSetupRes.error);
		}

		const backups = [
			['settings', performSettingsRestore],
			['widgets', performWidgetsRestore],
			['metadata', performMetadataRestore],
			['blocktank', performBlocktankRestore],
			['slashtags', performSlashtagsRestore],
			['activity', performLDKActivityRestore],
		] as const;

		for (const [name, func] of backups) {
			const res = await func();
			if (res.isErr()) {
				// Since this backup feature is not critical and mostly for user convenience
				// there's no reason to throw an error here.
				console.log(`Error restoring ${name}`, res.error.message);
			}
		}

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

export const performBackup = async (
	category: EBackupCategories,
): Promise<Result<string>> => {
	try {
		let data: {};
		switch (category) {
			case EBackupCategories.settings:
				data = getSettingsStore();
				break;
			case EBackupCategories.widgets:
				data = getWidgetsStore();
				break;
			case EBackupCategories.metadata:
				data = getMetaDataStore();
				break;
			case EBackupCategories.blocktank:
				const { paidOrders, orders } = getBlocktankStore();
				data = { paidOrders, orders };
				break;
			case EBackupCategories.slashtags:
				const { contacts } = getSlashtagsStore();
				data = { contacts };
				break;
			case EBackupCategories.ldkActivity:
				data = getActivityStore().items.filter(
					(a) => a.activityType === EActivityType.lightning,
				);
				break;
		}

		const metadata: TBackupMetadata = {
			category,
			timestamp: Date.now(),
			version: getStore()._persist.version,
		};

		const content = JSON.stringify({ data, metadata });

		dispatch(backupStart({ category }));
		const backupRes = await ldk.backupFile(category, content);
		if (backupRes.isErr()) {
			throw backupRes.error;
		}
		dispatch(backupSuccess({ category }));
		return ok(`Backup ${category} success`);
	} catch (e) {
		console.log(`Backup ${category} error`, e.message);
		dispatch(backupError({ category }));
		return err(e);
	}
};

/**
 * Retrieves the backup data for the provided backupCategory.
 * @param {EBackupCategories} category
 * @returns {Promise<Result<T | null>>}
 */
const getBackup = async <T>(
	category: EBackupCategories,
): Promise<Result<{ data: T; metadata: TBackupMetadata }>> => {
	try {
		const fetchRes = await ldk.fetchBackupFile(category);
		if (fetchRes.isErr()) {
			return err(fetchRes.error);
		}

		const content = JSON.parse(fetchRes.value);
		return ok(content);
	} catch (e) {
		console.log(`GetBackup ${category} error`, e.message);
		return err(e);
	}
};

const performSettingsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TSettings>(EBackupCategories.settings);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		const expectedBackupShape = getDefaultSettingsShape();
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (!isObjPartialMatch(backup, expectedBackupShape)) {
			return ok({ backupExists: false });
		}

		// apply migrations
		if (backupRes.value.metadata.version < 36) {
			// @ts-ignore migrate unit
			backup.unit = backup.unit === 'satoshi' ? EUnit.BTC : backup.unit;
		}

		dispatch(
			updateSettings({
				...expectedBackupShape,
				...backup,
				biometrics: false,
				pin: false,
				pinForPayments: false,
				pinOnLaunch: true,
			}),
		);
		dispatch(backupSuccess({ category: EBackupCategories.settings }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.settings} error`, e.message);
		return err(e);
	}
};

const performWidgetsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TWidgetsState>(EBackupCategories.widgets);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
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
		dispatch(backupSuccess({ category: EBackupCategories.widgets }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.widgets} error`, e.message);
		return err(e);
	}
};

const performMetadataRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TMetadataState>(
			EBackupCategories.metadata,
		);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		const expectedBackupShape = initialMetadataState;
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (
			!isObjPartialMatch(backup, expectedBackupShape, ['tags', 'slashTagsUrls'])
		) {
			return ok({ backupExists: false });
		}

		dispatch(updateMetadata({ ...expectedBackupShape, ...backup }));
		dispatch(backupSuccess({ category: EBackupCategories.metadata }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.metadata} error`, e.message);
		return err(e);
	}
};

const performBlocktankRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<Partial<IBlocktank>>(
			EBackupCategories.blocktank,
		);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (!('orders' in backup && 'paidOrders' in backup)) {
			return ok({ backupExists: false });
		}

		dispatch(updateBlocktank(backup));
		dispatch(backupSuccess({ category: EBackupCategories.blocktank }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.blocktank} error`, e.message);
		return err(e);
	}
};

const performSlashtagsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<Partial<TSlashtagsState>>(
			EBackupCategories.slashtags,
		);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (!('contacts' in backup)) {
			return ok({ backupExists: false });
		}

		dispatch(addContacts(backup.contacts!));
		dispatch(backupSuccess({ category: EBackupCategories.slashtags }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.slashtags} error`, e.message);
		return err(e);
	}
};

const performLDKActivityRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TActivity['items']>(
			EBackupCategories.ldkActivity,
		);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		!(
			Array.isArray(backup) &&
			backup.every((i) => i.activityType === EActivityType.lightning)
		);

		dispatch(addActivityItems(backup));
		dispatch(backupSuccess({ category: EBackupCategories.ldkActivity }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategories.ldkActivity} error`, e.message);
		return err(e);
	}
};
