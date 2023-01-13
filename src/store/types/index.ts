import { IUi } from './ui';
import { IUser } from './user';
import { IWalletStore } from './wallet';
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
import { IWidgetsStore } from './widgets';

export enum EStore {
	ui = 'ui',
	user = 'user',
	wallet = 'wallet',
	receive = 'receive',
	settings = 'settings',
	lightning = 'lightning',
	activity = 'activity',
	backup = 'backup',
	blocktank = 'blocktank',
	todos = 'todos',
	fees = 'fees',
	metadata = 'metadata',
	slashtags = 'slashtags',
	widgets = 'widgets',
}

interface Store {
	[EStore.ui]: IUi;
	[EStore.user]: IUser;
	[EStore.wallet]: IWalletStore;
	[EStore.receive]: IReceive;
	[EStore.settings]: ISettings;
	[EStore.lightning]: ILightning;
	[EStore.activity]: IActivity;
	[EStore.backup]: IBackup;
	[EStore.blocktank]: IBlocktank;
	[EStore.todos]: ITodos;
	[EStore.fees]: IFees;
	[EStore.metadata]: IMetadata;
	[EStore.slashtags]: ISlashtags;
	[EStore.widgets]: IWidgetsStore;
}

export default Store;
