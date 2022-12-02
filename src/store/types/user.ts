import { TAssetNetwork } from './wallet';
import { IActivityItem } from './activity';

export type TViewController =
	| 'sendNavigation'
	| 'receiveNavigation'
	| 'backupPrompt'
	| 'backupNavigation'
	| 'forceTransfer'
	| 'forgotPIN'
	| 'PINPrompt'
	| 'PINNavigation'
	| 'boostPrompt'
	| 'activityTagsPrompt'
	| 'newTxPrompt'
	| 'highBalance'
	| 'profileAddDataForm'
	| 'addContactModal'
	| 'slashauthModal';

export type TUserViewController = {
	[key in TViewController]: IViewControllerData;
};

export interface IViewControllerData {
	isOpen: boolean;
	id?: string;
	asset?: string;
	assetNetwork?: TAssetNetwork;
	snapPoint?: number;
	activityItem?: IActivityItem;
	txid?: string;
	showLaterButton?: boolean;
	url?: string;
}

export interface IUser {
	loading: boolean;
	error: boolean;
	isHydrated: boolean;
	isOnline: boolean;
	isConnectedToElectrum: boolean;
	ignoreBackupTimestamp: number;
	ignoreHighBalanceCount: number;
	ignoreHighBalanceTimestamp: number;
	backupVerified: boolean;
	requiresRemoteRestore: boolean;
	viewController: TUserViewController;
	isGeoBlocked: boolean;
}
