import Store from '../types';
import { IBackup } from '../types/backup';

export const backupSelector = (state: Store): IBackup => state.backup;
