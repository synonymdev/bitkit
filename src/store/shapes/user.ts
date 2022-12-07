import { IUser, IViewControllerData } from '../types/user';

export const defaultViewController: IViewControllerData = {
	isOpen: false,
	id: '',
	asset: '',
	assetNetwork: undefined,
	snapPoint: -1,
	txid: undefined,
};

export const defaultViewControllers: IUser['viewController'] = {
	sendNavigation: defaultViewController,
	receiveNavigation: defaultViewController,
	backupPrompt: defaultViewController,
	backupNavigation: defaultViewController,
	forceTransfer: defaultViewController,
	forgotPIN: defaultViewController,
	PINPrompt: defaultViewController,
	PINNavigation: defaultViewController,
	boostPrompt: defaultViewController,
	activityTagsPrompt: defaultViewController,
	newTxPrompt: defaultViewController,
	highBalance: defaultViewController,
	profileAddDataForm: defaultViewController,
	addContactModal: defaultViewController,
	slashauthModal: defaultViewController,
};

export const defaultUserShape: IUser = {
	loading: false,
	error: false,
	isHydrated: false,
	isOnline: true,
	isConnectedToElectrum: true,
	ignoreBackupTimestamp: 0,
	ignoreHighBalanceCount: 0,
	ignoreHighBalanceTimestamp: 0,
	startCoopCloseTimestamp: 0,
	backupVerified: false,
	requiresRemoteRestore: false,
	// Used to control various views throughout the app. (Modals, bottom-sheets, etc.)
	viewController: defaultViewControllers,
	isGeoBlocked: false,
};
