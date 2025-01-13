import Clipboard from '@react-native-clipboard/clipboard';
import { Result, err, ok } from '@synonymdev/result';
import { Platform } from 'react-native';

import { getSettingsStore } from '../store/helpers';
import { sleep } from './helpers';
import { parseUri } from './scanner/scanner';

export const checkClipboardData = async (): Promise<Result<string>> => {
	const { enableAutoReadClipboard } = getSettingsStore();

	if (!enableAutoReadClipboard) {
		return err('Read clipboard not enabled');
	}

	// Add delay otherwise clipboard is empty on Android app to foreground
	if (Platform.OS === 'android') {
		await sleep(1000);
	}

	const clipboardData = await Clipboard.getString();
	if (!clipboardData) {
		return err('Clipboard is empty');
	}

	const decodeRes = await parseUri(clipboardData);
	if (decodeRes.isErr()) {
		return err('Invalid clipboard data');
	}

	return ok(clipboardData);
};
