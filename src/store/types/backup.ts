import { ENetworks, TAccount } from '@synonymdev/react-native-ldk';
import { EBackupCategories } from '../utils/backup';

export type TBackupItem = {
	running: boolean;
	required: number; // timestamp of last time this backup was required
	synced: number; // timestamp of last time this backup was synced
};

export type TBackupState = {
	[key in EBackupCategories]: TBackupItem;
};

export declare type TAccountBackup<T> = {
	account: TAccount;
	package_version: string;
	network: ENetworks;
	data: T;
};

export type TBackupMetadata = {
	category: EBackupCategories;
	timestamp: number;
	version: number;
};
