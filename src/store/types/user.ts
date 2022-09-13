import { TAssetNetwork } from './wallet';
import { IActivityItem } from './activity';

export type TViewController =
	| 'sendNavigation'
	| 'receiveNavigation'
	| 'numberPad'
	| 'numberPadFee'
	| 'numberPadReceive'
	| 'backupPrompt'
	| 'backupNavigation'
	| 'PINPrompt'
	| 'PINNavigation'
	| 'boostPrompt'
	| 'activityTagsPrompt'
	| 'newTxPrompt'
	| 'profileAddDataForm'
	| 'profileAddLinkForm'
	| 'addContactModal';

export type TUserViewController = {
	[key in TViewController]: IViewControllerData;
};

export interface IViewControllerData {
	isOpen: boolean;
	id?: string;
	asset?: string;
	assetNetwork?: TAssetNetwork;
	assetName?: string;
	snapPoint?: number;
	initial?: string;
	activityItem?: IActivityItem;
	txid?: string;
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
