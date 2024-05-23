import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { useDebouncedEffect } from '../../hooks/helpers';
import { useAppSelector } from '../../hooks/redux';
import { backupSelector } from '../../store/reselect/backup';
import { EBackupCategories, performBackup } from '../../store/utils/backup';
import { showToast } from '../notifications';

const BACKUP_DEBOUNCE = 5000; // 5 seconds
const BACKUP_CHECK_INTERVAL = 60 * 1000; // 1 minute
export const FAILED_BACKUP_CHECK_TIME = 30 * 60 * 1000; // 30 minutes
const FAILED_BACKUP_NOTIFICATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

const EnabledSlashtag = (): ReactElement => {
	const { t } = useTranslation('settings');
	const backup = useAppSelector(backupSelector);
	const [now, setNow] = useState<number>(new Date().getTime());

	const backupSettings = backup[EBackupCategories.settings];
	const backupWidgets = backup[EBackupCategories.widgets];
	const backupMetadata = backup[EBackupCategories.metadata];
	const backupBlocktank = backup[EBackupCategories.blocktank];
	const backupSlashtags = backup[EBackupCategories.slashtags];
	const backupLDKActivity = backup[EBackupCategories.ldkActivity];

	useDebouncedEffect(
		() => {
			if (backupSettings.synced > backupSettings.required) {
				return;
			}
			performBackup(EBackupCategories.settings);
		},
		[backupSettings.synced, backupSettings.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupWidgets.synced > backupWidgets.required) {
				return;
			}
			performBackup(EBackupCategories.widgets);
		},
		[backupWidgets.synced, backupWidgets.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupMetadata.synced > backupMetadata.required) {
				return;
			}
			performBackup(EBackupCategories.metadata);
		},
		[backupMetadata.synced, backupMetadata.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupBlocktank.synced > backupBlocktank.required) {
				return;
			}
			performBackup(EBackupCategories.blocktank);
		},
		[backupBlocktank.synced, backupBlocktank.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupSlashtags.synced > backupSlashtags.required) {
				return;
			}
			performBackup(EBackupCategories.slashtags);
		},
		[backupSlashtags.synced, backupSlashtags.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupLDKActivity.synced > backupLDKActivity.required) {
				return;
			}
			performBackup(EBackupCategories.ldkActivity);
		},
		[backupLDKActivity.synced, backupLDKActivity.required],
		BACKUP_DEBOUNCE,
	);

	const shouldShowBackupWarning = useMemo(() => {
		if (__E2E__) {
			return false;
		}

		// find if there are any backup categories that have been failing for more than 30 minutes
		return Object.values(EBackupCategories).some((key) => {
			return (
				backup[key].synced < backup[key].required &&
				now - backup[key].required > FAILED_BACKUP_CHECK_TIME
			);
		});
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
				description: t('backup.failed_message', {
					interval: BACKUP_CHECK_INTERVAL / 60000, // displayed in minutes
				}),
			});
		}, FAILED_BACKUP_NOTIFICATION_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [t, shouldShowBackupWarning]);

	return <></>;
};

const BackupSubscriber = (): ReactElement => {
	return <EnabledSlashtag />;
};

export default BackupSubscriber;
