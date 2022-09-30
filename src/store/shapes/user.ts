import { IViewControllerData } from '../types/user';

export const defaultViewController: IViewControllerData = {
	isOpen: false,
	id: '',
	asset: '',
	assetNetwork: undefined,
	snapPoint: -1,
	txid: undefined,
};

export const defaultUserShape = {
	loading: false,
	error: false,
	isHydrated: false,
	isOnline: true,
	isConnectedToElectrum: true,
	ignoreBackupTimestamp: 0,
	backupVerified: false,
	// Used to control various views throughout the app. (Modals, bottom-sheets, etc.)
	viewController: {
		sendNavigation: { ...defaultViewController },
		receiveNavigation: { ...defaultViewController },
		backupPrompt: { ...defaultViewController },
		backupNavigation: { ...defaultViewController },
		forgotPIN: { ...defaultViewController },
		PINPrompt: { ...defaultViewController },
		PINNavigation: { ...defaultViewController },
		numberPadSend: { ...defaultViewController },
		numberPadReceive: { ...defaultViewController },
		boostPrompt: { ...defaultViewController },
		activityTagsPrompt: { ...defaultViewController },
		newTxPrompt: { ...defaultViewController },
		profileAddDataForm: { ...defaultViewController },
		profileAddLink: { ...defaultViewController },
		addContactModal: { ...defaultViewController },
	},
};
