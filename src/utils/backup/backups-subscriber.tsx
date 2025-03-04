import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { useDebouncedEffect } from '../../hooks/helpers';
import { useAppSelector } from '../../hooks/redux';
import { backupSelector } from '../../store/reselect/backup';
import { EBackupCategory } from '../../store/types/backup';
import { performBackup } from '../../store/utils/backup';
import { showToast } from '../notifications';

const BACKUP_DEBOUNCE = 5000; // 5 seconds
const BACKUP_CHECK_INTERVAL = 60 * 1000; // 1 minute
export const FAILED_BACKUP_CHECK_TIME = 30 * 60 * 1000; // 30 minutes
const FAILED_BACKUP_NOTIFICATION_INTERVAL = 10 * 60 * 1000; // 10 minutes

const BackupSubscriber = (): ReactElement => {
	const { t } = useTranslation('settings');
	const backup = useAppSelector(backupSelector);
	const [now, setNow] = useState<number>(new Date().getTime());

	const backupWallet = backup[EBackupCategory.wallet];
	const backupSettings = backup[EBackupCategory.settings];
	const backupWidgets = backup[EBackupCategory.widgets];
	const backupMetadata = backup[EBackupCategory.metadata];
	const backupBlocktank = backup[EBackupCategory.blocktank];
	const backupSlashtags = backup[EBackupCategory.slashtags];
	const backupLDKActivity = backup[EBackupCategory.ldkActivity];

	useDebouncedEffect(
		() => {
			if (backupWallet.synced > backupWallet.required) {
				return;
			}
			performBackup(EBackupCategory.wallet);
		},
		[backupWallet.synced, backupWallet.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupSettings.synced > backupSettings.required) {
				return;
			}
			performBackup(EBackupCategory.settings);
		},
		[backupSettings.synced, backupSettings.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupWidgets.synced > backupWidgets.required) {
				return;
			}
			performBackup(EBackupCategory.widgets);
		},
		[backupWidgets.synced, backupWidgets.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupMetadata.synced > backupMetadata.required) {
				return;
			}
			performBackup(EBackupCategory.metadata);
		},
		[backupMetadata.synced, backupMetadata.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupBlocktank.synced > backupBlocktank.required) {
				return;
			}
			performBackup(EBackupCategory.blocktank);
		},
		[backupBlocktank.synced, backupBlocktank.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupSlashtags.synced > backupSlashtags.required) {
				return;
			}
			performBackup(EBackupCategory.slashtags);
		},
		[backupSlashtags.synced, backupSlashtags.required],
		BACKUP_DEBOUNCE,
	);
	useDebouncedEffect(
		() => {
			if (backupLDKActivity.synced > backupLDKActivity.required) {
				return;
			}
			performBackup(EBackupCategory.ldkActivity);
		},
		[backupLDKActivity.synced, backupLDKActivity.required],
		BACKUP_DEBOUNCE,
	);

	const shouldShowBackupWarning = useMemo(() => {
		if (__E2E__) {
			return false;
		}

		// find if there are any backup categories that have been failing for more than 30 minutes
		return Object.values(EBackupCategory).some((key) => {
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

export default BackupSubscriber;
