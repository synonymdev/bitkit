// NOTE: 'ui' reducer is not persisted to storage

import { IUi, IViewControllerData } from '../types/ui';

export const defaultViewController: IViewControllerData = {
	isOpen: false,
	id: '',
	asset: '',
	assetNetwork: undefined,
	txid: undefined,
};

export const defaultViewControllers: IUi['viewControllers'] = {
	appUpdatePrompt: defaultViewController,
	closeChannelSuccess: defaultViewController,
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

export const defaultUiShape: IUi = {
	availableUpdateType: null,
	isConnectedToElectrum: true,
	isOnline: true,
	profileLink: { title: '', url: '' },
	// Used to control various views throughout the app. (Modals, bottom-sheets, etc.)
	viewControllers: defaultViewControllers,
};
