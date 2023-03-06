import RNRestart from 'react-native-restart';
import { err, ok, Result } from '@synonymdev/result';
import { Platform, BackHandler } from 'react-native';

import actions from './actions';
import { getDispatch } from '../helpers';
import { getSelectedNetwork, getSelectedWallet } from '../../utils/wallet';
import { getAllKeychainKeys, resetKeychainValue } from '../../utils/helpers';
import { wipeLdkStorage } from '../../utils/lightning';
import { removePin } from '../../utils/settings';
import { TAvailableNetworks } from '../../utils/networks';
import { ICustomElectrumPeer, ISettings } from '../types/settings';
import { showSuccessNotification } from '../../utils/notifications';
import { TWalletName } from '../types/wallet';

const dispatch = getDispatch();

export const updateSettings = (payload: Partial<ISettings>): Result<string> => {
	dispatch({
		type: actions.UPDATE_SETTINGS,
		payload,
	});
	return ok('');
};

/*
 * This resets the settings store to defaultSettingsShape
 */
export const resetSettingsStore = (): Result<string> => {
	dispatch({ type: actions.RESET_SETTINGS_STORE });
	return ok('');
};

/**
 * This method will wipe all data for the specified wallet.
 * @async
 * @param {TWalletName} [selectedWallet]
 * @param {boolean} [showNotification]
 * @param {boolean} [restartApp]
 * @return {Promise<Result<string>>}
 */
export const wipeApp = async ({
	selectedWallet,
	showNotification = true,
	restartApp = true,
}: {
	selectedWallet?: TWalletName;
	showNotification?: boolean;
	restartApp?: boolean;
} = {}): Promise<Result<string>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}

		// Reset everything else
		await Promise.all([
			removePin(),
			wipeKeychain(),
			wipeLdkStorage({ selectedWallet }),
		]);

		// Reset Redux stores & persisted storage
		dispatch({ type: actions.WIPE_APP });

		if (showNotification) {
			showSuccessNotification({
				title: 'Bitkit Wiped Successfully',
				message: 'All app data has been reset.',
			});
		}

		// BackHandler.exitApp() works fine on Android and closes the app
		// for iOS we are using react-native-restart to restart the app
		if (restartApp) {
			if (Platform.OS === 'android') {
				BackHandler.exitApp();
			} else {
				RNRestart.Restart();
			}
		}
		return ok('');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Wipes all known device keychain data.
 * @returns {Promise<void>}
 */
export const wipeKeychain = async (): Promise<void> => {
	const allServices = await getAllKeychainKeys();
	await Promise.all(
		allServices.map((key) => {
			resetKeychainValue({ key });
		}),
	);
};

/**
 * Adds a single Electrum peer to the custom peer list.
 * In its current form it replaces any previously saved peer.
 * @param {ICustomElectrumPeer} peer
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return Promise<Result<string>>
 */
export const addElectrumPeer = async ({
	peer,
	selectedNetwork,
}: {
	selectedNetwork?: TAvailableNetworks | undefined;
	peer: ICustomElectrumPeer;
}): Promise<Result<string>> => {
	try {
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		let customElectrumPeers: ICustomElectrumPeer[] = [];
		//TODO: Uncomment if we ever support more than one custom peer at a time.
		/*
		// Gather custom peers array.
		customElectrumPeers: ICustomElectrumPeer[] =
			getStore().settings.customElectrumPeers[selectedNetwork];
		// Find potential duplicates/matches.
		const matches: ICustomElectrumPeer[] = await Promise.all(
			customElectrumPeers.filter((customPeer) => {
				return objectsMatch(customPeer, peer);
			}),
		);
		//This peer already exists. No need to add a duplicate.
		if (matches.length > 0) {
			return ok('');
		}
		*/
		customElectrumPeers.push(peer);
		const payload = {
			customElectrumPeers,
			selectedNetwork,
		};
		dispatch({
			type: actions.UPDATE_ELECTRUM_PEERS,
			payload,
		});
		return ok('');
	} catch (e) {
		console.log(e);
		return err(e);
	}
};
