import { createSelector } from '@reduxjs/toolkit';
import Store from '../types';
import {
	IUi,
	IViewControllerData,
	TProfileLink,
	TUserViewController,
	TViewController,
} from '../types/ui';

const uiState = (state: Store): IUi => state.ui;

const viewControllerState = (state: Store): TUserViewController =>
	state.ui.viewControllers;
/**
 * Returns all viewController data.
 */
export const viewControllersSelector = createSelector(
	[uiState],
	(ui): TUserViewController => ui.viewControllers,
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
		(viewControllers, viewController: TViewController): TViewController =>
			viewController,
	],
	(viewControllers, viewController): IViewControllerData =>
		viewControllers[viewController],
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
		(viewControllers, viewController: TViewController): TViewController =>
			viewController,
	],
	(viewControllers, viewController): boolean =>
		viewControllers[viewController].isOpen,
);

export const showLaterButtonSelector = createSelector(
	[uiState],
	(ui): boolean | undefined => ui.viewControllers.PINPrompt.showLaterButton,
);

export const profileLinkSelector = createSelector(
	[uiState],
	(ui): TProfileLink => ui.profileLink,
);
