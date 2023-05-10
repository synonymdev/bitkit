import { IUser } from '../types/user';

export const defaultUserShape: IUser = {
	backupVerified: false,
	betaRiskAccepted: false,
	ignoreAppUpdateTimestamp: 0,
	ignoreBackupTimestamp: 0,
	ignoreHighBalanceCount: 0,
	ignoreHighBalanceTimestamp: 0,
	isGeoBlocked: false,
	lightningSettingUpStep: 0,
	requiresRemoteRestore: false,
	startCoopCloseTimestamp: 0,
};
