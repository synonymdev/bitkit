import {
	ENetworks,
	TAccount,
} from '@synonymdev/react-native-ldk/dist/utils/types';

export interface IBackup {
	//Backpack
	remoteBackupsEnabled: boolean;
	remoteLdkBackupSynced: boolean;
	remoteLdkBackupLastSync?: number;
	remoteSettingsBackupSynced: boolean;
	remoteWidgetsBackupSynced: boolean;
	remoteMetadataBackupSynced: boolean;
	remoteLdkActivityBackupSynced: boolean;
	remoteBlocktankBackupSynced: boolean;
	//TODO transactions, slashtags, metadata, etc.

	//iCloud
	iCloudBackupsEnabled: boolean;
	iCloudLdkBackupsSynced: boolean;
	iCloudLdkBackupLastSync?: number;
	//TODO transactions, slashtags, metadata, etc.

	//Google Drive
	gDriveBackupsEnabled: boolean;
	gDriveLdkBackupsSynced: boolean;
	gDriveLdkBackupLastSync?: number;
	//TODO transactions, slashtags, metadata, etc.
}

export declare type TAccountBackup<T> = {
	account: TAccount;
	package_version: string;
	network: ENetworks;
	data: T;
};
