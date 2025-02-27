import { Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';

import {
	SheetId,
	getAllSheetRefs,
	getSheetRefOutsideComponent,
} from '../../navigation/bottom-sheet/SheetRefsProvider';
import { vibrate } from '../../utils/helpers';
import { dispatch } from '../helpers';
import { setAppUpdateInfo, showSheet as showSheetRedux } from '../slices/ui';
import { EActivityType } from '../types/activity';
import { TAvailableUpdate, ViewControllerParamList } from '../types/ui';

const releaseUrl =
	'https://github.com/synonymdev/bitkit/releases/download/updater/release.json';

export const showSheet = <View extends keyof ViewControllerParamList>(
	...args: undefined extends ViewControllerParamList[View]
		? [view: View] | [view: View, params: ViewControllerParamList[View]]
		: [view: View, params: ViewControllerParamList[View]]
): void => {
	const [id, params] = args;
	console.log('Opening sheet outside component:', id);
	const sheetRef = getSheetRefOutsideComponent(id);
	sheetRef.current?.present();
	dispatch(showSheetRedux({ view: id, params }));
};

export const closeSheet = (id: SheetId): void => {
	console.log('Closing sheet outside component:', id);
	const sheetRef = getSheetRefOutsideComponent(id);
	sheetRef.current?.close();
};

export const closeAllSheets = (): void => {
	const allSheetRefs = getAllSheetRefs();
	allSheetRefs.forEach(({ id }) => closeSheet(id));
};

export const showNewOnchainTxPrompt = ({
	id,
	value,
}: {
	id: string;
	value: number;
}): void => {
	const activityItem = { id, activityType: EActivityType.onchain, value };
	vibrate({ type: 'default' });
	showSheet('newTxPrompt', { activityItem });
	closeSheet('receiveNavigation');
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
