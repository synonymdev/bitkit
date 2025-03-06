import { Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';

import { Keyboard } from '../../hooks/keyboard';
import {
	SheetId,
	getAllSheetRefs,
	getSheetRefOutsideComponent,
} from '../../navigation/bottom-sheet/SheetRefsProvider';
import { vibrate } from '../../utils/helpers';
import { dispatch } from '../helpers';
import {
	// closeSheet as closeSheetRedux,
	setAppUpdateInfo,
	showSheet as showSheetRedux,
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
	const [id, params] = args;
	console.log('Opening sheet outside component:', id);
	const sheetRef = getSheetRefOutsideComponent(id);

	// const index = sheetRef.current?.getCurrentIndex();
	// console.log({ index });
	// const isOpen = sheetRef.current?.isOpen;
	// console.log({ isOpen });

	if (!sheetRef.current?.isOpen) {
		sheetRef.current?.present();
		dispatch(showSheetRedux({ view: id, params }));
	}
};

export const closeSheet = async (id: SheetId): Promise<void> => {
	console.log('Closing sheet outside component:', id);
	await Keyboard.dismiss();
	const sheetRef = getSheetRefOutsideComponent(id);
	sheetRef.current?.close();
	// NOTE: params are reset in onClose of BottomSheetWrapper
	// dispatch(closeSheetRedux(id));
};

export const closeAllSheets = (): void => {
	console.log('Closing all sheets');
	const allSheetRefs = getAllSheetRefs();
	const openSheets = allSheetRefs.filter(({ ref }) => ref.current?.isOpen);
	console.log({ openSheets });
	openSheets.forEach(({ id }) => closeSheet(id));
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
	showBottomSheet('newTxPrompt', { activityItem });
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
