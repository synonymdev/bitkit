import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import {
	IUser,
	IViewControllerData,
	TUserViewController,
	TViewController,
} from '../types/user';

const userState = (state: Store): IUser => state.user;
const viewControllerState = (state: Store): TUserViewController =>
	state.user.viewController;
/**
 * Returns all viewController data.
 */
export const viewControllersSelector = createSelector(
	[userState],
	(user): TUserViewController => user.viewController,
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

export const isGeoBlockedSelector = createSelector(
	[userState],
	(user): boolean => user.isGeoBlocked ?? false,
);

export const backupVerifiedSelector = createSelector(
	[userState],
	(user): boolean => user.backupVerified,
);

export const ignoreBackupTimestampSelector = createSelector(
	[userState],
	(user): number => user.ignoreBackupTimestamp,
);

export const showLaterButtonSelector = createSelector(
	[userState],
	(user): boolean | undefined => user.viewController.PINPrompt.showLaterButton,
);
