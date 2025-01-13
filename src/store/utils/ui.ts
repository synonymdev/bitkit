import { Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';

import { vibrate } from '../../utils/helpers';
import { dispatch, getActivityStore } from '../helpers';
import {
	closeSheet,
	setAppUpdateInfo,
	showSheet,
	toggleSheet,
} from '../slices/ui';
import { EActivityType } from '../types/activity';
import { TAvailableUpdate, ViewControllerParamList } from '../types/ui';

const releaseUrl =
	'https://github.com/synonymdev/bitkit/releases/download/updater/release.json';

export const showBottomSheet = <View extends keyof ViewControllerParamList>(
	...args: undefined extends ViewControllerParamList[View]
		? [view: View] | [view: View, params: ViewControllerParamList[View]]
		: [view: View, params: ViewControllerParamList[View]]
): void => {
	const [view, params] = args;
	dispatch(showSheet({ view, params }));
};

export const toggleBottomSheet = <View extends keyof ViewControllerParamList>(
	...args: undefined extends ViewControllerParamList[View]
		? [view: View] | [view: View, params: ViewControllerParamList[View]]
		: [view: View, params: ViewControllerParamList[View]]
): void => {
	const [view, params] = args;
	dispatch(toggleSheet({ view, params }));
};

export const showNewOnchainTxPrompt = ({
	id,
	value,
}: {
	id: string;
	value: number;
}): void => {
	vibrate({ type: 'default' });
	showBottomSheet('newTxPrompt', {
		activityItem: {
			id,
			activityType: EActivityType.onchain,
			value,
		},
	});

	dispatch(closeSheet('receiveNavigation'));
};

export const showNewTxPrompt = (txId: string): void => {
	const activityItem = getActivityStore().items.find(({ id }) => id === txId);

	if (activityItem) {
		vibrate({ type: 'default' });
		showBottomSheet('newTxPrompt', { activityItem });
		dispatch(closeSheet('receiveNavigation'));
	}
};

export const checkForAppUpdate = async (): Promise<void> => {
	const currentBuild = Number(getBuildNumber());
	const response = await fetch(releaseUrl);
	const releases = await response.json();
	const release: TAvailableUpdate = releases.platforms[Platform.OS];
	const latestBuild = release.buildNumber;
	const updateAvailable = latestBuild > currentBuild;

	if (updateAvailable) {
		dispatch(setAppUpdateInfo(release));
	}
};
