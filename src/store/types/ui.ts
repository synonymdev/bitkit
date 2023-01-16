import { TAssetNetwork } from './wallet';
import { TOnchainActivityItem } from './activity';

export type TViewController =
	| 'appUpdatePrompt'
	| 'closeChannelSuccess'
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
	activityItem?: TOnchainActivityItem;
	txid?: string;
	showLaterButton?: boolean;
	url?: string;
}

export type TProfileLink = {
	title: string;
	url: string;
};

export type TAvailableUpdateType = 'critical' | 'optional' | null;

export interface IUi {
	availableUpdateType: TAvailableUpdateType;
	isConnectedToElectrum: boolean;
	isOnline: boolean;
	profileLink: TProfileLink;
	viewControllers: TUserViewController;
}
