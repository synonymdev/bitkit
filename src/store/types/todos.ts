import { ImageSourcePropType } from 'react-native';
import { IColors } from '../../styles/colors';

export type TTodoType =
	| 'backupSeedPhrase'
	| 'pin'
	| 'lightning'
	| 'lightningSettingUp'
	| 'lightningConnecting'
	| 'lightningReady'
	| 'transferPending'
	| 'transferClosingChannel'
	| 'slashtagsProfile'
	| 'buyBitcoin'
	| 'btFailed';

export interface ITodo {
	id: TTodoType;
	color: keyof IColors;
	image: ImageSourcePropType;
	dismissable: boolean;
	duration?: number;
}

export interface IOpenChannelNotification {
	[key: string]: number;
}

export type TTodosState = {
	hide: Partial<{ [K in TTodoType]: number }>;
	newChannelsNotifications: IOpenChannelNotification;
};
