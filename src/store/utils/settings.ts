import { Result, err, ok } from '@synonymdev/result';
import RNRestart from 'react-native-restart';

import { __E2E__ } from '../../constants/env';
import { sleep } from '../../utils/helpers';
import i18n from '../../utils/i18n';
import { wipeKeychain } from '../../utils/keychain';
import { wipeLdkStorage } from '../../utils/lightning';
import { showToast } from '../../utils/notifications';
import { removePin } from '../../utils/settings';
import { getOnChainWallet, getSelectedWallet } from '../../utils/wallet';
import actions from '../actions/actions';
import { dispatch } from '../helpers';
import { TWalletName } from '../types/wallet';

/**
 * This method will wipe all data for the specified wallet.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @param {boolean} [showNotification]
 * @param {boolean} [restartApp]
 * @return {Promise<Result<string>>}
 */
export const wipeApp = async ({
	selectedWallet = getSelectedWallet(),
	showNotification = true,
	restartApp = true,
}: {
	selectedWallet?: TWalletName;
	showNotification?: boolean;
	restartApp?: boolean;
} = {}): Promise<Result<string>> => {
	try {
		// stop onchain wallet if it exists
		try {
			const wallet = getOnChainWallet();
			await wallet.stop();
		} catch (e) {}

		// Reset Redux stores & persisted storage
		dispatch({ type: actions.WIPE_APP });

		// Reset everything else
		await Promise.all([
			removePin(),
			wipeKeychain(),
			wipeLdkStorage({ selectedWallet }),
		]);

		if (showNotification) {
			showToast({
				type: 'success',
				title: i18n.t('security:wiped_title'),
				description: i18n.t('security:wiped_message'),
			});
		}

		if (restartApp && !__E2E__) {
			// avoid freeze on iOS
			await sleep(1000);
			RNRestart.Restart();
		}

		return ok('');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};
