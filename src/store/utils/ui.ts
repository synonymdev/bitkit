import { Platform } from 'react-native';
import { getBuildNumber } from 'react-native-device-info';

import { Keyboard } from '../../hooks/keyboard';
import { getSheetRefOutsideComponent } from '../../sheets/SheetRefsProvider';
import { vibrate } from '../../utils/helpers';
import { dispatch } from '../helpers';
import { setAppUpdateInfo } from '../slices/ui';
import { EActivityType } from '../types/activity';
import { SheetId, SheetsParamList, TAvailableUpdate } from '../types/ui';

const releaseUrl =
	'https://github.com/synonymdev/bitkit/releases/download/updater/release.json';

export const showSheet = <Id extends keyof SheetsParamList>(
	...args: undefined extends SheetsParamList[Id]
		? [id: Id] | [id: Id, params: SheetsParamList[Id]]
		: [id: Id, params: SheetsParamList[Id]]
): void => {
	const [id, params] = args;
	const sheetRef = getSheetRefOutsideComponent(id);
	sheetRef.current?.present(params);
};

export const closeSheet = async (id: SheetId): Promise<void> => {
	const sheetRef = getSheetRefOutsideComponent(id);
	await Keyboard.dismiss();
	// NOTE: params are reset in onClose of BottomSheet
	sheetRef.current?.close();
};

export const showNewOnchainTxPrompt = ({
	id,
	value,
}: {
	id: string;
	value: number;
}): void => {
	vibrate({ type: 'default' });
	showSheet('receivedTx', {
		id,
		activityType: EActivityType.onchain,
		value,
	});
	closeSheet('receive');
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
