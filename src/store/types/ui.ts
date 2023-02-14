import { TOnchainActivityItem } from './activity';
import { SendStackParamList } from '../../navigation/bottom-sheet/SendNavigation';

export type ViewControllerParamList = {
	activityTagsPrompt: { id: string };
	addContactModal: undefined;
	appUpdatePrompt: undefined;
	backupNavigation: undefined;
	backupPrompt: undefined;
	boostPrompt: { activityItem: TOnchainActivityItem };
	closeChannelSuccess: undefined;
	forceTransfer: undefined;
	forgotPIN: undefined;
	highBalance: undefined;
	newTxPrompt: { txId: string };
	PINNavigation: undefined;
	PINPrompt: { showLaterButton: boolean };
	profileAddDataForm: undefined;
	receiveNavigation: undefined;
	sendNavigation: { screen: keyof SendStackParamList } | undefined;
	slashauthModal: { url: string };
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
	activityItem?: TOnchainActivityItem;
	id?: string;
	screen?: keyof SendStackParamList;
	showLaterButton?: boolean;
	txId?: string;
	url?: string;
};

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
	viewControllers: TUiViewController;
}
