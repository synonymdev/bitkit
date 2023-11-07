// NOTE: 'ui' reducer is not persisted to storage

import { IUi } from '../types/ui';

export const defaultViewController = { isOpen: false };

export const defaultViewControllers: IUi['viewControllers'] = {
	activityTagsPrompt: defaultViewController,
	addContactModal: defaultViewController,
	appUpdatePrompt: defaultViewController,
	backupNavigation: defaultViewController,
	backupPrompt: defaultViewController,
	boostPrompt: defaultViewController,
	closeChannelSuccess: defaultViewController,
	forceTransfer: defaultViewController,
	forgotPIN: defaultViewController,
	highBalance: defaultViewController,
	newTxPrompt: defaultViewController,
	PINNavigation: defaultViewController,
	profileAddDataForm: defaultViewController,
	receiveNavigation: defaultViewController,
	sendNavigation: defaultViewController,
	slashauthModal: defaultViewController,
	timeRangePrompt: defaultViewController,
	treasureHunt: defaultViewController,
	tagsPrompt: defaultViewController,
	lnurlWithdraw: defaultViewController,
	lnurlPay: defaultViewController,
};

export const defaultUiShape: IUi = {
	availableUpdate: null,
	isAuthenticated: false,
	isConnectedToElectrum: true,
	isOnline: true,
	isLDKReady: false, // LDK node running and connected
	language: 'en',
	profileLink: { title: '', url: '' },
	timeZone: 'UTC',
	// Used to control bottom-sheets throughout the app
	viewControllers: defaultViewControllers,
	fromAddressViewer: false, // When true, ensures tx inputs are not cleared when sweeping from address viewer.
};
