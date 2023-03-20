import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import {
	IUi,
	TProfileLink,
	TViewController,
	TUiViewController,
	IViewControllerData,
} from '../types/ui';

const uiState = (state: Store): IUi => state.ui;

const viewControllerState = (state: Store): TUiViewController => {
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
 * @param {Store} state
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
 * @param {Store} state
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
	(ui): boolean | undefined => ui.viewControllers.PINPrompt.showLaterButton,
);

export const profileLinkSelector = createSelector(
	[uiState],
	(ui): TProfileLink => ui.profileLink,
);

export const isOnlineSelector = createSelector(
	[uiState],
	(ui): boolean => ui.isOnline,
);

export const isConnectedToElectrumSelector = createSelector(
	[uiState],
	(ui): boolean => ui.isConnectedToElectrum,
);

export const availableUpdateSelector = createSelector(
	[uiState],
	(ui) => ui.availableUpdate,
);
