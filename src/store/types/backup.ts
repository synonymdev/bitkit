import { ENetworks, TAccount } from '@synonymdev/react-native-ldk';
import { EBackupCategory } from '../utils/backup';

export type TBackupItem = {
	running: boolean;
	required: number; // timestamp of last time this backup was required
	synced: number; // timestamp of last time this backup was synced
};

export type TBackupState = {
	[key in EBackupCategory]: TBackupItem;
};

export declare type TAccountBackup<T> = {
	account: TAccount;
	package_version: string;
	network: ENetworks;
	data: T;
};

export type TBackupMetadata = {
	category: EBackupCategory;
	timestamp: number;
	version: number;
};
