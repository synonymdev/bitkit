import { TAssetNetwork } from './wallet';
import { IActivityItem } from './activity';

export type TViewController =
	| 'appUpdatePrompt'
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
	activityItem?: IActivityItem;
	txid?: string;
	showLaterButton?: boolean;
	url?: string;
}

export type TProfileLink = {
	title: string;
	url: string;
};

export interface IUi {
	availableUpdateType: 'critical' | 'optional' | null;
	isConnectedToElectrum: boolean;
	isOnline: boolean;
	profileLink: TProfileLink;
	viewControllers: TUserViewController;
}
