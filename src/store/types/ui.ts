import { LNURLWithdrawParams, LNURLPayParams } from 'js-lnurl';
import { EActivityType, TOnchainActivityItem } from './activity';
import { ReceiveStackParamList } from '../../navigation/bottom-sheet/ReceiveNavigation';
import { SendStackParamList } from '../../navigation/bottom-sheet/SendNavigation';

export type ViewControllerParamList = {
	activityTagsPrompt: { id: string };
	addContactModal: undefined;
	appUpdatePrompt: undefined;
	backupNavigation: undefined;
	backupPrompt: undefined;
	boostPrompt: { onchainActivityItem: TOnchainActivityItem };
	connectionClosed: undefined;
	forceTransfer: undefined;
	forgotPIN: undefined;
	highBalance: undefined;
	newTxPrompt: {
		activityItem: { id: string; activityType: EActivityType; value: number };
	};
	orangeTicket: { ticketId: string };
	PINNavigation: { showLaterButton: boolean };
	profileAddDataForm: undefined;
	receiveNavigation: { receiveScreen: keyof ReceiveStackParamList } | undefined;
	sendNavigation: { screen: keyof SendStackParamList } | undefined;
	timeRangePrompt: undefined;
	transferFailed: undefined;
	treasureHunt: { chestId: string };
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
	activityItem?: { id: string; activityType: EActivityType; value: number };
	chestId?: string;
	onchainActivityItem?: TOnchainActivityItem;
	id?: string;
	screen?: keyof SendStackParamList;
	receiveScreen?: keyof ReceiveStackParamList;
	showLaterButton?: boolean;
	ticketId?: string;
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

export type TUiState = {
	availableUpdate: TAvailableUpdate | null;
	isAuthenticated: boolean;
	isConnectedToElectrum: boolean;
	isElectrumThrottled: boolean;
	isOnline: boolean;
	isLDKReady: boolean;
	isProfiling: boolean;
	profileLink: TProfileLink;
	viewControllers: TUiViewController;
	timeZone: string;
	language: string;
	fromAddressViewer: boolean;
};
