import React, { ReactElement, useEffect } from 'react';
import lm from '@synonymdev/react-native-ldk';
import {
	performRemoteBackup,
	performRemoteLdkBackup,
} from '../../store/actions/backup';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { isSlashtagsDisabled } from '../slashtags';
import { useSelector } from 'react-redux';
import { backupSelector } from '../../store/reselect/backup';
import { selectedNetworkSelector } from '../../store/reselect/wallet';
import { getSettingsStore, getWidgetsStore } from '../../store/helpers';
import { EBackupCategories } from './backpack';

const EnabledSlashtag = (): ReactElement => {
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { slashtag } = useSelectedSlashtag();
	const backup = useSelector(backupSelector);

	//TODO perform other backup types (tags/metadata)

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
	useEffect(() => {
		if (!backup?.remoteSettingsBackupSynced) {
			const settings = getSettingsStore();
			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteSettingsBackupSynced',
				backupCategory: EBackupCategories.settings,
				selectedNetwork,
				backup: settings,
			}).then();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [backup?.remoteSettingsBackupSynced, slashtag]);

	// Attempts to backup widgets anytime remoteWidgetsBackupSynced is set to false.
	useEffect(() => {
		if (!backup?.remoteWidgetsBackupSynced) {
			const widgets = getWidgetsStore();
			performRemoteBackup({
				slashtag,
				isSyncedKey: 'remoteWidgetsBackupSynced',
				backupCategory: EBackupCategories.widgets,
				selectedNetwork,
				backup: widgets,
			}).then();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [backup?.remoteWidgetsBackupSynced, slashtag]);

	return <></>;
};

const BackupSubscriber = (): ReactElement => {
	return !isSlashtagsDisabled ? <EnabledSlashtag /> : <></>;
};

export default BackupSubscriber;
