import { ImageSourcePropType } from 'react-native';
import { IColors } from '../../styles/colors';

export type TTodoType =
	| 'backupSeedPhrase'
	| 'boost'
	| 'pin'
	| 'lightning'
	| 'lightningSettingUp'
	| 'transfer'
	| 'transferInProgress'
	| 'transferClosingChannel'
	| 'slashtagsProfile'
	| 'buyBitcoin';

export interface ITodo {
	id: TTodoType;
	color: keyof IColors;
	image: ImageSourcePropType;
	dismissable: boolean;
}

export type ITodos = TTodoType[];
