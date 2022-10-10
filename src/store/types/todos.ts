export type TTodoType =
	| 'backupSeedPhrase'
	| 'boost'
	| 'pin'
	| 'lightning'
	| 'lightningSettingUp'
	| 'slashtagsProfile'
	| 'buyBitcoin';

export interface ITodo {
	id: string;
	type: TTodoType;
	title: string;
	description: string;
}

export interface ITodos {
	todos: ITodo[];
	dismissedTodos: string[];
}
