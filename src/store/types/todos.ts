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
}

export type ITodos = ITodo[];
