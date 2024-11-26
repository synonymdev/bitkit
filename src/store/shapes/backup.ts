import { TBackupItem, TBackupState } from '../types/backup';
import { EBackupCategory } from '../utils/backup';

const item: TBackupItem = {
	required: Date.now() - 1000,
	synced: Date.now(),
	running: false,
};

export const initialBackupState: TBackupState = {
	[EBackupCategory.wallet]: { ...item },
	[EBackupCategory.widgets]: { ...item },
	[EBackupCategory.settings]: { ...item },
	[EBackupCategory.metadata]: { ...item },
	[EBackupCategory.blocktank]: { ...item },
	[EBackupCategory.slashtags]: { ...item },
	[EBackupCategory.ldkActivity]: { ...item },
};
