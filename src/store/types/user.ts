import { TAssetNetwork } from './wallet';
import { IActivityItem } from './activity';

export type TViewController =
	| 'sendNavigation'
	| 'receiveNavigation'
	| 'numberPadSend'
	| 'numberPadReceive'
	| 'backupPrompt'
	| 'backupNavigation'
	| 'forgotPIN'
	| 'PINPrompt'
	| 'PINNavigation'
	| 'boostPrompt'
	| 'activityTagsPrompt'
	| 'newTxPrompt'
	| 'profileAddDataForm'
	| 'profileAddLink'
	| 'addContactModal';

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
}

export interface IUser {
	loading: boolean;
	error: boolean;
	isHydrated: boolean;
	isOnline: boolean;
	isConnectedToElectrum: boolean;
	ignoreBackupTimestamp: number;
	backupVerified: boolean;
	viewController: TUserViewController;
}
