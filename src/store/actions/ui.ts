import { Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';
import { ok, Result } from '@synonymdev/result';

import { IUi, TAvailableUpdate, ViewControllerParamList } from '../types/ui';
import { getDispatch } from '../helpers';
import actions from './actions';

const releaseUrl =
	'https://github.com/synonymdev/bitkit/releases/download/updater/release.json';

const dispatch = getDispatch();

export const updateUi = (payload: Partial<IUi>): Result<string> => {
	dispatch({
		type: actions.UPDATE_UI,
		payload,
	});
	return ok('');
};

export const showBottomSheet = <View extends keyof ViewControllerParamList>(
	...args: undefined extends ViewControllerParamList[View]
		? [view: View] | [view: View, params: ViewControllerParamList[View]]
		: [view: View, params: ViewControllerParamList[View]]
): Result<string> => {
	const [view, params] = args;

	dispatch({
		type: actions.SHOW_SHEET,
		payload: { view, params },
	});

	return ok('');
};

export const closeBottomSheet = (id: keyof ViewControllerParamList): void => {
	dispatch({
		type: actions.CLOSE_SHEET,
		payload: id,
	});
};

export const updateProfileLink = (payload: {
	title: string;
	url?: string;
}): Result<string> => {
	dispatch({
		type: actions.UPDATE_PROFILE_LINK,
		payload,
	});
	return ok('');
};

export const checkForAppUpdate = async (): Promise<void> => {
	const currentBuild = Number(getBuildNumber());
	const response = await fetch(releaseUrl);
	const releases = await response.json();
	const release: TAvailableUpdate = releases.platforms[Platform.OS];
	const latestBuild = release.buildNumber;
	const updateAvailable = latestBuild > currentBuild;

	if (updateAvailable) {
		dispatch({
			type: actions.SET_APP_UPDATE_INFO,
			payload: release,
		});
	}
};

/*
 * This reset the user store to defaultUserShape
 */
export const resetUiStore = (): Result<string> => {
	dispatch({ type: actions.RESET_UI_STORE });
	return ok('');
};
