import { IUser } from '../types/user';

export const defaultUserShape: IUser = {
	backupVerified: false,
	ignoreAppUpdateTimestamp: 0,
	ignoreBackupTimestamp: 0,
	ignoreHighBalanceCount: 0,
	ignoreHighBalanceTimestamp: 0,
	isGeoBlocked: false,
	requiresRemoteRestore: false,
	startCoopCloseTimestamp: 0,
	betaRiskAccepted: false,
};
