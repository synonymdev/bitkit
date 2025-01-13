import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
	IViewControllerData,
	TSendTransaction,
	TUiState,
	TUiViewController,
	TViewController,
} from '../types/ui';

const uiState = (state: RootState): TUiState => state.ui;

const viewControllerState = (state: RootState): TUiViewController => {
	return state.ui.viewControllers;
};

/**
 * Returns all viewController data.
 */
export const viewControllersSelector = createSelector(
	[uiState],
	(ui): TUiViewController => ui.viewControllers,
);

/**
 * Returns specified viewController data.
 * @param {RootState} state
 * @param {TViewController} viewController
 * @returns {IViewControllerData}
 */
export const viewControllerSelector = createSelector(
	[
		viewControllerState,
		(_viewControllers, viewController: TViewController): TViewController => {
			return viewController;
		},
	],
	(viewControllers, viewController): IViewControllerData => {
		return viewControllers[viewController];
	},
);

/**
 * Returns boolean on whether a given viewController is open.
 * @param {RootState} state
 * @param {TViewController} viewController
 * @returns {boolean}
 */
export const viewControllerIsOpenSelector = createSelector(
	[
		viewControllerState,
		(_viewControllers, viewController: TViewController): TViewController => {
			return viewController;
		},
	],
	(viewControllers, viewController): boolean => {
		return viewControllers[viewController].isOpen;
	},
);

export const showLaterButtonSelector = createSelector(
	[uiState],
	(ui) => ui.viewControllers.PINNavigation.showLaterButton,
);

export const profileLinkSelector = createSelector(
	[uiState],
	(ui) => ui.profileLink,
);

export const isAuthenticatedSelector = createSelector(
	[uiState],
	(ui) => ui.isAuthenticated,
);

export const isOnlineSelector = createSelector(
	[uiState],
	(ui): boolean => ui.isOnline,
);

export const isLDKReadySelector = createSelector(
	[uiState],
	(ui): boolean => ui.isLDKReady,
);

export const isConnectedToElectrumSelector = createSelector(
	[uiState],
	(ui): boolean => ui.isConnectedToElectrum,
);

export const isElectrumThrottledSelector = createSelector(
	[uiState],
	(ui): boolean => ui.isElectrumThrottled,
);

export const appStateSelector = createSelector([uiState], (ui) => ui.appState);

export const availableUpdateSelector = createSelector(
	[uiState],
	(ui) => ui.availableUpdate,
);

export const criticalUpdateSelector = createSelector(
	[uiState],
	(ui) => ui.availableUpdate?.critical ?? false,
);

export const timeZoneSelector = createSelector([uiState], (ui) => ui.timeZone);

export const languageSelector = createSelector([uiState], (ui) => ui.language);

export const sendTransactionSelector = (state: RootState): TSendTransaction => {
	return state.ui.sendTransaction;
};
