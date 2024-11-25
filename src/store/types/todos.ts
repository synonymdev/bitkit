import { ImageSourcePropType } from 'react-native';
import { IColors } from '../../styles/colors';

export type TTodoType =
	| 'backupSeedPhrase'
	| 'btFailed'
	| 'buyBitcoin'
	| 'discount'
	| 'invite'
	| 'lightning'
	| 'lightningSettingUp'
	| 'lightningConnecting'
	| 'lightningReady'
	| 'quickpay'
	| 'slashtagsProfile'
	| 'support'
	| 'transferPending'
	| 'transferClosingChannel'
	| 'pin';

export interface ITodo {
	id: TTodoType;
	color: keyof IColors;
	image: ImageSourcePropType;
	dismissable: boolean;
	confirmsIn?: number;
}

export interface IOpenChannelNotification {
	[key: string]: number;
}

export type TTodosState = {
	hide: Partial<{ [K in TTodoType]: number }>;
	newChannelsNotifications: IOpenChannelNotification;
};
