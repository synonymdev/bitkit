import { IUi } from './ui';
import { IUser } from './user';
import { IWallet } from './wallet';
import { IReceive } from './receive';
import { ISettings } from './settings';
import { ILightning } from './lightning';
import { IActivity } from './activity';
import { IBackup } from './backup';
import { IBlocktank } from './blocktank';
import { ITodos } from './todos';
import { IFees } from './fees';
import { IMetadata } from './metadata';
import { ISlashtags } from './slashtags';

export default interface Store {
	ui: IUi;
	user: IUser;
	wallet: IWallet;
	receive: IReceive;
	settings: ISettings;
	lightning: ILightning;
	activity: IActivity;
	backup: IBackup;
	blocktank: IBlocktank;
	todos: ITodos;
	fees: IFees;
	metadata: IMetadata;
	slashtags: ISlashtags;
}
