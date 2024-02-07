import { TBackupItem, TBackupState } from '../types/backup';
import { EBackupCategories } from '../utils/backup';

const item: TBackupItem = {
	required: Date.now() - 1000,
	synced: Date.now(),
	running: false,
};

export const initialBackupState: TBackupState = {
	[EBackupCategories.widgets]: { ...item },
	[EBackupCategories.settings]: { ...item },
	[EBackupCategories.metadata]: { ...item },
	[EBackupCategories.blocktank]: { ...item },
	[EBackupCategories.slashtags]: { ...item },
	[EBackupCategories.ldkActivity]: { ...item },
};
