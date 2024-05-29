// NOTE: 'ui' reducer is not persisted to storage

import { TUiState } from '../types/ui';

export const defaultViewController = { isOpen: false };

export const defaultViewControllers: TUiState['viewControllers'] = {
	activityTagsPrompt: defaultViewController,
	addContactModal: defaultViewController,
	appUpdatePrompt: defaultViewController,
	backupNavigation: defaultViewController,
	backupPrompt: defaultViewController,
	boostPrompt: defaultViewController,
	connectionClosed: defaultViewController,
	forceTransfer: defaultViewController,
	forgotPIN: defaultViewController,
	highBalance: defaultViewController,
	newTxPrompt: defaultViewController,
	orangeTicket: defaultViewController,
	PINNavigation: defaultViewController,
	profileAddDataForm: defaultViewController,
	receiveNavigation: defaultViewController,
	sendNavigation: defaultViewController,
	timeRangePrompt: defaultViewController,
	transferFailed: defaultViewController,
	treasureHunt: defaultViewController,
	tagsPrompt: defaultViewController,
	lnurlWithdraw: defaultViewController,
	lnurlPay: defaultViewController,
};

export const initialUiState: TUiState = {
	availableUpdate: null,
	isAuthenticated: false,
	isConnectedToElectrum: true,
	isElectrumThrottled: false,
	isOnline: true,
	isLDKReady: false, // LDK node running and connected
	isProfiling: false,
	language: 'en',
	profileLink: { title: '', url: '' },
	timeZone: 'UTC',
	// Used to control bottom-sheets throughout the app
	viewControllers: defaultViewControllers,
	fromAddressViewer: false, // When true, ensures tx inputs are not cleared when sweeping from address viewer.
};
