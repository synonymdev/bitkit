import React, { ReactElement, useEffect } from 'react';
import lm from '@synonymdev/react-native-ldk';
import { useSelector } from 'react-redux';

import {
	performRemoteBackup,
	performRemoteLdkBackup,
} from '../../store/actions/backup';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { isSlashtagsDisabled } from '../slashtags';
import { backupSelector } from '../../store/reselect/backup';
import { selectedNetworkSelector } from '../../store/reselect/wallet';
import { EBackupCategories } from './backpack';
import { useDebouncedEffect } from '../../hooks/helpers';
import { settingsSelector } from '../../store/reselect/settings';
import { metadataState } from '../../store/reselect/metadata';
import { widgetsState } from '../../store/reselect/widgets';

const BACKUP_DEBOUNCE = 5000;

const EnabledSlashtag = (): ReactElement => {
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { slashtag } = useSelectedSlashtag();
	const backup = useSelector(backupSelector);
	const settings = useSelector(settingsSelector);
	const metadata = useSelector(metadataState);
	const widgets = useSelector(widgetsState);

	useEffect(() => {
		const sub = lm.subscribeToBackups((res) => {
			performRemoteLdkBackup(
				slashtag,
				res.isOk() ? res.value : undefined,
			).catch(console.error);
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
				backupCategory: EBackupCategories.metadata,
				selectedNetwork,
				backup: metadata,
			}).then();
		},
		[backup.remoteMetadataBackupSynced, slashtag, metadata, selectedNetwork],
		BACKUP_DEBOUNCE,
	);

	return <></>;
};

const BackupSubscriber = (): ReactElement => {
	return !isSlashtagsDisabled ? <EnabledSlashtag /> : <></>;
};

export default BackupSubscriber;
