import { getReadableVersion } from 'react-native-device-info';
import { ok, Result } from '@synonymdev/result';
import semverDiff from 'semver/functions/diff';

import { getDispatch } from '../helpers';
import actions from './actions';
import { IViewControllerData, TViewController } from '../types/ui';
import { defaultViewController } from '../shapes/ui';

const releaseUrl = 'https://api.github.com/repos/synonymdev/bitkit/releases';

const dispatch = getDispatch();

// TODO: improve typing for each view type
export const toggleView = (payload: {
	view: TViewController;
	data: IViewControllerData;
}): Result<string> => {
	if (!payload.data.isOpen) {
		// close view and reset viewController state
		payload.data = defaultViewController;
	}

	dispatch({
		type: actions.TOGGLE_VIEW,
		payload,
	});
	return ok('');
};

export const closeAllViews = (): Result<string> => {
	dispatch({ type: actions.CLOSE_VIEWS });
	return ok('');
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
	const currentVersion = getReadableVersion();
	const response = await fetch(releaseUrl);
	const releases = await response.json();
	const latestVersion = releases[0].tag_name;
	const diff = semverDiff(currentVersion, latestVersion);

	if (diff) {
		const criticalReleaseTypes = ['major', 'premajor', 'minor', 'preminor'];
		const updateType = criticalReleaseTypes.includes(diff)
			? 'critical'
			: 'optional';

		dispatch({
			type: actions.SET_APP_UPDATE_TYPE,
			payload: updateType,
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
