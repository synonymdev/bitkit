import lm, { ldk, TBackupServerDetails } from '@synonymdev/react-native-ldk';
import { Result, err, ok } from '@synonymdev/result';
import { IBoostedTransactions } from 'beignet';

import {
	__BACKUPS_SERVER_HOST__,
	__BACKUPS_SERVER_PUBKEY__,
	__DEFAULT_BITCOIN_NETWORK__,
} from '../../constants/env';
import { deepCompareStructure, isObjPartialMatch } from '../../utils/helpers';
import {
	getLdkAccount,
	getNetwork,
	setLdkStoragePath,
} from '../../utils/lightning';
import { EAvailableNetwork } from '../../utils/networks';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import {
	dispatch,
	getActivityStore,
	getBlocktankStore,
	getMetaDataStore,
	getSettingsStore,
	getSlashtagsStore,
	getStore,
	getWalletStore,
	getWidgetsStore,
} from '../helpers';
import { getDefaultSettingsShape } from '../shapes/settings';
import { getDefaultWalletShape } from '../shapes/wallet';
import {
	TActivity,
	addActivityItems,
	resetActivityState,
} from '../slices/activity';
import { backupError, backupStart, backupSuccess } from '../slices/backup';
import { updateBlocktank } from '../slices/blocktank';
import { initialMetadataState, updateMetadata } from '../slices/metadata';
import { TSettings, updateSettings } from '../slices/settings';
import { addContacts } from '../slices/slashtags';
import { restoreBoostedTransactions, restoreTransfers } from '../slices/wallet';
import {
	TWidgetsState,
	initialWidgetsState,
	updateWidgets,
} from '../slices/widgets';
import { EActivityType } from '../types/activity';
import { EBackupCategory, TBackupMetadata } from '../types/backup';
import { IBlocktank } from '../types/blocktank';
import { TMetadataState } from '../types/metadata';
import { TSlashtagsState } from '../types/slashtags';
import { IWalletItem, TTransfer } from '../types/wallet';
import { updateOnChainActivityList } from './activity';

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

	const network = getNetwork(selectedNetwork);

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

		for (const network of Object.values(EAvailableNetwork)) {
			// Always run for mainnet, but only run for test networks if in dev mode
			// or if it matches the default network
			if (
				network === EAvailableNetwork.bitcoin ||
				network === __DEFAULT_BITCOIN_NETWORK__ ||
				__DEV__
			) {
				const ldkBackupRes = await performLdkRestore({
					backupServerDetails,
					selectedNetwork: network,
				});
				if (ldkBackupRes.isErr()) {
					return err(ldkBackupRes.error.message);
				}
			}
		}

		// reset backup settings once again before restoring all other backups
		const selectedNetwork = getSelectedNetwork();
		const network = getNetwork(selectedNetwork);
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
			['wallet', performWalletRestore],
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
	category: EBackupCategory,
): Promise<Result<string>> => {
	try {
		let data: {};
		switch (category) {
			case EBackupCategory.wallet: {
				const selectedWallet = getSelectedWallet();
				const wallet = getWalletStore().wallets[selectedWallet];
				const { transfers, boostedTransactions } = wallet;
				data = { boostedTransactions, transfers };
				break;
			}
			case EBackupCategory.settings: {
				data = getSettingsStore();
				break;
			}
			case EBackupCategory.widgets: {
				data = getWidgetsStore();
				break;
			}
			case EBackupCategory.metadata: {
				data = getMetaDataStore();
				break;
			}
			case EBackupCategory.blocktank: {
				const { paidOrders, orders } = getBlocktankStore();
				data = { paidOrders, orders };
				break;
			}
			case EBackupCategory.slashtags: {
				const { contacts } = getSlashtagsStore();
				data = { contacts };
				break;
			}
			case EBackupCategory.ldkActivity: {
				data = getActivityStore().items.filter(
					(a) => a.activityType === EActivityType.lightning,
				);
				break;
			}
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
 * @param {EBackupCategory} category
 * @returns {Promise<Result<T | null>>}
 */
const getBackup = async <T>(
	category: EBackupCategory,
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

type TWalletBackup = {
	boostedTransactions: IWalletItem<IBoostedTransactions>;
	transfers: IWalletItem<TTransfer[]>;
};

const performWalletRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TWalletBackup>(EBackupCategory.wallet);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		const defaultWalletShape = getDefaultWalletShape();
		const expectedBackupShape = {
			boostedTransactions: defaultWalletShape.boostedTransactions,
			transfers: defaultWalletShape.transfers,
		};

		// If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (!deepCompareStructure(backup, expectedBackupShape, 1)) {
			console.log('Backup does not exist');
			return ok({ backupExists: false });
		}

		// because activity has been updated already before this point
		// we need to reset the activity state to show boosts correctly
		dispatch(resetActivityState());
		dispatch(restoreBoostedTransactions(backup.boostedTransactions));
		dispatch(restoreTransfers(backup.transfers));
		dispatch(backupSuccess({ category: EBackupCategory.wallet }));
		updateOnChainActivityList();

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.wallet} error`, e.message);
		return err(e);
	}
};

const performSettingsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TSettings>(EBackupCategory.settings);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		const expectedBackupShape = getDefaultSettingsShape();
		//If the keys in the backup object are not found in the reference object assume the backup does not exist.
		if (!isObjPartialMatch(backup, expectedBackupShape)) {
			return ok({ backupExists: false });
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
		dispatch(backupSuccess({ category: EBackupCategory.settings }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.settings} error`, e.message);
		return err(e);
	}
};

const performWidgetsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TWidgetsState>(EBackupCategory.widgets);
		if (backupRes.isErr()) {
			return err(backupRes.error.message);
		}

		const backup = backupRes.value.data;
		const expectedBackupShape = initialWidgetsState;

		// Skip restore if backup contains legacy slashfeed widgets
		// NOTE: can be removed after all users have updated from 1.0.9
		const hasSlashfeedWidgets =
			Object.keys(backup.widgets).some((key) => key.includes('slashfeed')) ||
			backup.sortOrder.some((key) => key.includes('slashfeed'));

		if (hasSlashfeedWidgets) {
			return ok({ backupExists: false });
		}

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
		dispatch(backupSuccess({ category: EBackupCategory.widgets }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.widgets} error`, e.message);
		return err(e);
	}
};

const performMetadataRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TMetadataState>(EBackupCategory.metadata);
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

		// apply migrations
		if (backupRes.value.metadata.version < 47) {
			backup.comments = {};
		}

		dispatch(updateMetadata({ ...expectedBackupShape, ...backup }));
		dispatch(backupSuccess({ category: EBackupCategory.metadata }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.metadata} error`, e.message);
		return err(e);
	}
};

const performBlocktankRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<Partial<IBlocktank>>(
			EBackupCategory.blocktank,
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
		dispatch(backupSuccess({ category: EBackupCategory.blocktank }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.blocktank} error`, e.message);
		return err(e);
	}
};

const performSlashtagsRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<Partial<TSlashtagsState>>(
			EBackupCategory.slashtags,
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
		dispatch(backupSuccess({ category: EBackupCategory.slashtags }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.slashtags} error`, e.message);
		return err(e);
	}
};

const performLDKActivityRestore = async (): Promise<
	Result<{ backupExists: boolean }>
> => {
	try {
		const backupRes = await getBackup<TActivity['items']>(
			EBackupCategory.ldkActivity,
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
		dispatch(backupSuccess({ category: EBackupCategory.ldkActivity }));

		// Restore success
		return ok({ backupExists: true });
	} catch (e) {
		console.log(`Restore ${EBackupCategory.ldkActivity} error`, e.message);
		return err(e);
	}
};
