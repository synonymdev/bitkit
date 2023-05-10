export interface IUser {
	backupVerified: boolean;
	betaRiskAccepted: boolean;
	ignoreAppUpdateTimestamp: number;
	ignoreBackupTimestamp: number;
	ignoreHighBalanceCount: number;
	ignoreHighBalanceTimestamp: number;
	isGeoBlocked: boolean;
	lightningSettingUpStep: number;
	requiresRemoteRestore: boolean;
	startCoopCloseTimestamp: number;
}
