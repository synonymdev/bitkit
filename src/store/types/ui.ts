import { LNURLWithdrawParams, LNURLPayParams } from 'js-lnurl';
import { IActivityItem, TOnchainActivityItem } from './activity';
import { SendStackParamList } from '../../navigation/bottom-sheet/SendNavigation';

export type ViewControllerParamList = {
	activityTagsPrompt: { id: string };
	addContactModal: undefined;
	appUpdatePrompt: undefined;
	backupNavigation: undefined;
	backupPrompt: undefined;
	boostPrompt: { onchainActivityItem: TOnchainActivityItem };
	closeChannelSuccess: undefined;
	forceTransfer: undefined;
	forgotPIN: undefined;
	highBalance: undefined;
	newTxPrompt: { activityItem: IActivityItem };
	PINNavigation: { showLaterButton: boolean };
	profileAddDataForm: undefined;
	receiveNavigation: undefined;
	sendNavigation: { screen: keyof SendStackParamList } | undefined;
	slashauthModal: { url: string };
	timeRangePrompt: undefined;
	tagsPrompt: undefined;
	lnurlWithdraw: { wParams: LNURLWithdrawParams };
	lnurlPay: { pParams: LNURLPayParams };
};

export type TViewController = keyof ViewControllerParamList;

export type TUiViewController = {
	[key in TViewController]: undefined extends ViewControllerParamList[key]
		? { isOpen: boolean }
		: Partial<ViewControllerParamList[key]> & { isOpen: boolean };
};

// this type is needed because reselect doesn't offer good parameter typing
export type IViewControllerData = {
	isOpen: boolean;
	activityItem?: IActivityItem;
	onchainActivityItem?: TOnchainActivityItem;
	id?: string;
	screen?: keyof SendStackParamList;
	showLaterButton?: boolean;
	txId?: string;
	url?: string;
	wParams?: LNURLWithdrawParams;
	pParams?: LNURLPayParams;
};

export type TProfileLink = {
	title: string;
	url: string;
};

export type TAvailableUpdate = {
	version: string;
	buildNumber: number;
	notes: string;
	pub_date: string;
	url: string;
	critical: boolean;
};

export interface IUi {
	availableUpdate: TAvailableUpdate | null;
	isAuthenticated: boolean;
	isConnectedToElectrum: boolean;
	isOnline: boolean;
	profileLink: TProfileLink;
	viewControllers: TUiViewController;
	timeZone: string;
	language: string;
}
