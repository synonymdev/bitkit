import { ENetworks, TAccount } from '@synonymdev/react-native-ldk';

export enum EBackupCategory {
	wallet = 'bitkit_wallet',
	settings = 'bitkit_settings',
	widgets = 'bitkit_widgets',
	metadata = 'bitkit_metadata',
	blocktank = 'bitkit_blocktank_orders',
	slashtags = 'bitkit_slashtags_contacts',
	ldkActivity = 'bitkit_lightning_activity',
}

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
