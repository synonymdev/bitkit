import { LNURLPayParams, LNURLWithdrawParams } from 'js-lnurl';
import { AppStateStatus } from 'react-native';
import { ReceiveStackParamList } from '../../navigation/bottom-sheet/ReceiveNavigation';
import { SendStackParamList } from '../../navigation/bottom-sheet/SendNavigation';
import { EActivityType, TOnchainActivityItem } from './activity';

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
	pubkyAuth: { url: string };
	quickPay: undefined;
	receiveNavigation: { receiveScreen: keyof ReceiveStackParamList } | undefined;
	sendNavigation:
		| { screen: keyof SendStackParamList }
		| { screen: 'Quickpay'; invoice: string; amount: number }
		| { screen: 'LNURLAmount'; pParams: LNURLPayParams; url: string }
		| {
				screen: 'LNURLConfirm';
				pParams: LNURLPayParams;
				url: string;
				amount?: number;
		  }
		| undefined;
	timeRangePrompt: undefined;
	transferFailed: undefined;
	treasureHunt: { chestId: string };
	tagsPrompt: undefined;
	lnurlWithdraw: { wParams: LNURLWithdrawParams };
};

export type TViewController = keyof ViewControllerParamList;

type TViewProps = { isOpen: boolean; isMounted: boolean };

export type TUiViewController = {
	[key in TViewController]: undefined extends ViewControllerParamList[key]
		? TViewProps
		: Partial<ViewControllerParamList[key]> & TViewProps;
};

// this type is needed because reselect doesn't offer good parameter typing
export type IViewControllerData = {
	isOpen: boolean;
	isMounted: boolean;
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
	invoice?: string;
	amount?: number;
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

export type TSendTransaction = {
	paymentMethod: 'onchain' | 'lightning';
	uri: string;
	fromAddressViewer?: boolean;
};

export type THealthState = 'ready' | 'pending' | 'error';

export type TUiState = {
	appState: AppStateStatus;
	availableUpdate: TAvailableUpdate | null;
	isAuthenticated: boolean;
	isConnectedToElectrum: boolean;
	isElectrumThrottled: boolean;
	isOnline: boolean;
	isLDKReady: boolean;
	language: string;
	profileLink: TProfileLink;
	timeZone: string;
	viewControllers: TUiViewController;
	sendTransaction: TSendTransaction;
};
