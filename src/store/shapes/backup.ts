import { IBackup } from '../types/backup';

export const defaultBackupShape: IBackup = {
	remoteBackupsEnabled: false,
	remoteLdkBackupSynced: false,
	remoteSettingsBackupSynced: false,
	remoteWidgetsBackupSynced: false,
	remoteMetadataBackupSynced: false,

	iCloudBackupsEnabled: false,
	iCloudLdkBackupsSynced: false,

	gDriveBackupsEnabled: false,
	gDriveLdkBackupsSynced: false,
};
