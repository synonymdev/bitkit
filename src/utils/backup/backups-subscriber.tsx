import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import lm from '@synonymdev/react-native-ldk';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
	checkProfileAndContactsBackup,
	performRemoteBackup,
	performRemoteLdkBackup,
} from '../../store/actions/backup';
import { __DISABLE_SLASHTAGS__ } from '../../constants/env';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { backupSelector } from '../../store/reselect/backup';
import { selectedNetworkSelector } from '../../store/reselect/wallet';
import { EBackupCategories } from './backpack';
import { useDebouncedEffect } from '../../hooks/helpers';
import { settingsSelector } from '../../store/reselect/settings';
import { metadataState } from '../../store/reselect/metadata';
import { widgetsState } from '../../store/reselect/widgets';
import { activityItemsState } from '../../store/reselect/activity';
import { EActivityType } from '../../store/types/activity';
import { blocktankSelector } from '../../store/reselect/blocktank';
import { slashtagsSelector } from '../../store/reselect/slashtags';
import { showToast } from '../notifications';
import { __E2E__ } from '../../constants/env';

const BACKUP_DEBOUNCE = 5000; // 5 seconds
const BACKUP_CHECK_INTERVAL = 60 * 1000; // 1 minute
export const FAILED_BACKUP_CHECK_TIME = 30 * 60 * 1000; // 30 minutes
const FAILED_BACKUP_NOTIFICATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

const EnabledSlashtag = (): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { slashtag } = useSelectedSlashtag();
	const backup = useSelector(backupSelector);
	const settings = useSelector(settingsSelector);
	const metadata = useSelector(metadataState);
	const widgets = useSelector(widgetsState);
	const activity = useSelector(activityItemsState);
	const blocktank = useSelector(blocktankSelector);
	const slashtags = useSelector(slashtagsSelector);
	const [now, setNow] = useState<number>(new Date().getTime());

	useEffect(() => {
		const sub = lm.subscribeToBackups((res) => {
			performRemoteLdkBackup(
				slashtag,
				res.isOk() ? res.value : undefined,
			).catch((e) => {
				console.error('LDK backup error', e);
			});
		});

		return () => lm.unsubscribeFromBackups(sub);
	}, [slashtag]);

	// Attempts to backup settings anytime remoteSettingsBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteSettingsBackupSynced) {
				return;
			}
			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteSettingsBackupSynced',
				syncRequiredKey: 'remoteSettingsBackupSyncRequired',
				syncCompletedKey: 'remoteSettingsBackupLastSync',
				backupCategory: EBackupCategories.settings,
				selectedNetwork,
				backup: settings,
			}).then();
		},
		[backup.remoteSettingsBackupSynced, slashtag, settings, selectedNetwork],
		BACKUP_DEBOUNCE,
	);

	// Attempts to backup widgets anytime remoteWidgetsBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteWidgetsBackupSynced) {
				return;
			}
			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteWidgetsBackupSynced',
				syncRequiredKey: 'remoteWidgetsBackupSyncRequired',
				syncCompletedKey: 'remoteWidgetsBackupLastSync',
				backupCategory: EBackupCategories.widgets,
				selectedNetwork,
				backup: widgets,
			}).then();
		},
		[backup.remoteWidgetsBackupSynced, slashtag, widgets, selectedNetwork],
		BACKUP_DEBOUNCE,
	);

	// Attempts to backup metadata anytime remoteMetadataBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteMetadataBackupSynced) {
				return;
			}
			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteMetadataBackupSynced',
				syncRequiredKey: 'remoteMetadataBackupSyncRequired',
				syncCompletedKey: 'remoteMetadataBackupLastSync',
				backupCategory: EBackupCategories.metadata,
				selectedNetwork,
				backup: metadata,
			}).then();
		},
		[backup.remoteMetadataBackupSynced, slashtag, metadata, selectedNetwork],
		BACKUP_DEBOUNCE,
	);

	// Attempts to backup ldkActivity anytime remoteLdkActivityBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteLdkActivityBackupSynced) {
				return;
			}

			const ldkActivity = activity.filter(
				(a) => a.activityType === EActivityType.lightning,
			);

			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteLdkActivityBackupSynced',
				syncRequiredKey: 'remoteLdkActivityBackupSyncRequired',
				syncCompletedKey: 'remoteLdkActivityBackupLastSync',
				backupCategory: EBackupCategories.ldkActivity,
				selectedNetwork,
				backup: ldkActivity,
			}).then();
		},
		[backup.remoteLdkActivityBackupSynced, slashtag, activity, selectedNetwork],
		BACKUP_DEBOUNCE,
	);

	// Attempts to backup blocktank anytime remoteBlocktankBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteBlocktankBackupSynced) {
				return;
			}

			const back = {
				orders: blocktank.orders,
				paidOrders: blocktank.paidOrders,
			};

			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteBlocktankBackupSynced',
				syncRequiredKey: 'remoteBlocktankBackupSyncRequired',
				syncCompletedKey: 'remoteBlocktankBackupLastSync',
				backupCategory: EBackupCategories.blocktank,
				selectedNetwork,
				backup: back,
			}).then();
		},
		[
			backup.remoteBlocktankBackupSynced,
			slashtag,
			blocktank.orders,
			blocktank.paidOrders,
			selectedNetwork,
		],
		BACKUP_DEBOUNCE,
	);

	// Attempts to backup contacts anytime remoteSlashtagsBackupSynced is set to false.
	useDebouncedEffect(
		() => {
			if (backup.remoteSlashtagsBackupSynced) {
				return;
			}

			const back = {
				contacts: slashtags.contacts,
			};

			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteSlashtagsBackupSynced',
				syncRequiredKey: 'remoteSlashtagsBackupSyncRequired',
				syncCompletedKey: 'remoteSlashtagsBackupLastSync',
				backupCategory: EBackupCategories.slashtags,
				selectedNetwork,
				backup: back,
			}).then();
		},
		[
			backup.remoteSlashtagsBackupSynced,
			slashtag,
			slashtags.contacts,
			selectedNetwork,
		],
		BACKUP_DEBOUNCE,
	);

	const shouldShowBackupWarning = useMemo(() => {
		if (__E2E__) {
			return false;
		}

		if (
			(backup.remoteSettingsBackupSyncRequired &&
				now - backup.remoteSettingsBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteWidgetsBackupSyncRequired &&
				now - backup.remoteWidgetsBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteMetadataBackupSyncRequired &&
				now - backup.remoteMetadataBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteLdkActivityBackupSyncRequired &&
				now - backup.remoteLdkActivityBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteBlocktankBackupSyncRequired &&
				now - backup.remoteBlocktankBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteSlashtagsBackupSyncRequired &&
				now - backup.remoteSlashtagsBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME) ||
			(backup.remoteLdkActivityBackupSyncRequired &&
				now - backup.remoteLdkActivityBackupSyncRequired >
					FAILED_BACKUP_CHECK_TIME)
		) {
			return true;
		}
		return false;
	}, [backup, now]);

	useEffect(() => {
		const timer = setInterval(() => {
			setNow(new Date().getTime());
		}, BACKUP_CHECK_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, []);

	useEffect(() => {
		if (!shouldShowBackupWarning) {
			return;
		}

		const timer = setInterval(() => {
			showToast({
				type: 'error',
				title: t('backup.failed_title'),
				description: t('backup.failed_message'),
			});
		}, FAILED_BACKUP_NOTIFICATION_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [t, shouldShowBackupWarning]);

	useEffect(() => {
		if (__E2E__) {
			return;
		}

		const timer = setInterval(() => {
			checkProfileAndContactsBackup(slashtag);
		}, BACKUP_CHECK_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [slashtag]);

	return <></>;
};

const BackupSubscriber = (): ReactElement => {
	return !__DISABLE_SLASHTAGS__ ? <EnabledSlashtag /> : <></>;
};

export default BackupSubscriber;
