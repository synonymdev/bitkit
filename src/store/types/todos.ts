import { ImageSourcePropType } from 'react-native';
import { IColors } from '../../styles/colors';

export type TTodoType =
	| 'backupSeedPhrase'
	| 'boost'
	| 'pin'
	| 'lightning'
	| 'lightningSettingUp'
	| 'transfer'
	| 'slashtagsProfile'
	| 'buyBitcoin';

export interface ITodo {
	id: TTodoType;
	title: string;
	description: string;
	color: keyof IColors;
	image: ImageSourcePropType;
}

export type ITodos = ITodo[];
