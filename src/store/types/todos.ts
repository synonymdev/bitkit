import { ImageSourcePropType } from 'react-native';
import { IColors } from '../../styles/colors';

export type TTodoType =
	| 'backupSeedPhrase'
	| 'pin'
	| 'lightning'
	| 'lightningSettingUp'
	| 'lightningConnecting'
	| 'lightningReady'
	| 'transferToSpending'
	| 'transferToSavings'
	| 'transferClosingChannel'
	| 'slashtagsProfile'
	| 'buyBitcoin'
	| 'btFailed';

export interface ITodo {
	id: TTodoType;
	color: keyof IColors;
	image: ImageSourcePropType;
	dismissable: boolean;
}

export interface IOpenChannelNotification {
	[key: string]: number;
}

export type ITodos = {
	hide: Partial<{
		[K in TTodoType]: number;
	}>;
	newChannelsNotifications: IOpenChannelNotification;
};
