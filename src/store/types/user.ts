export interface IUser {
	backupVerified: boolean;
	ignoreAppUpdateTimestamp: number;
	ignoreBackupTimestamp: number;
	ignoreHighBalanceCount: number;
	ignoreHighBalanceTimestamp: number;
	isGeoBlocked: boolean;
	requiresRemoteRestore: boolean;
	startCoopCloseTimestamp: number;
	betaRiskAccepted: boolean;
}
