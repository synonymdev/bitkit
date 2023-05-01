import { IBackup } from '../types/backup';

export const defaultBackupShape: IBackup = {
	remoteBackupsEnabled: false,
	remoteLdkBackupSynced: false,
	remoteLdkBackupLastSyncRequired: undefined,
	remoteSettingsBackupSynced: false,
	remoteSettingsBackupLastSync: undefined,
	remoteSettingsBackupSyncRequired: undefined,
	remoteWidgetsBackupSynced: false,
	remoteWidgetsBackupLastSync: undefined,
	remoteWidgetsBackupSyncRequired: undefined,
	remoteMetadataBackupSynced: false,
	remoteMetadataBackupLastSync: undefined,
	remoteMetadataBackupSyncRequired: undefined,
	remoteLdkActivityBackupSynced: false,
	remoteLdkActivityBackupLastSync: undefined,
	remoteLdkActivityBackupSyncRequired: undefined,
	remoteBlocktankBackupSynced: false,
	remoteBlocktankBackupLastSync: undefined,
	remoteBlocktankBackupSyncRequired: undefined,

	hyperProfileSeedCheckSuccess: undefined,
	hyperProfileCheckRequested: undefined,
	hyperContactsCheckSuccess: undefined,
	hyperContactsCheckRequested: undefined,

	iCloudBackupsEnabled: false,
	iCloudLdkBackupsSynced: false,

	gDriveBackupsEnabled: false,
	gDriveLdkBackupsSynced: false,
};
