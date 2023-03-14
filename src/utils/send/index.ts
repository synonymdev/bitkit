import { Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { showSuccessNotification } from '../notifications';
import { processInputData } from '../scanner';
import { sleep } from '../helpers';
import i18n from '../i18n';

export const readClipboardData = async (): Promise<void> => {
	// Add delay otherwise clipboard is empty on Android app to foreground
	if (Platform.OS === 'android') {
		await sleep(1000);
	}

	const clipboardData = await Clipboard.getString();
	if (!clipboardData) {
		return;
	}

	const result = await processInputData({
		data: clipboardData,
		showErrors: false,
	});

	if (result.isOk()) {
		showSuccessNotification({
			title: i18n.t('other:scan_redirect_title'),
			message: i18n.t('other:scan_redirect_msg'),
		});
	}
};
