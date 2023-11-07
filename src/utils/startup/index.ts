import { InteractionManager } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';

import {
	generateMnemonic,
	getMnemonicPhrase,
	getBip39Passphrase,
	refreshWallet,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import { createWallet, updateExchangeRates } from '../../store/actions/wallet';
import { getWalletStore } from '../../store/helpers';
import { refreshBlocktankInfo } from '../../store/actions/blocktank';
import { connectToElectrum, subscribeToHeader } from '../wallet/electrum';
import { updateOnchainFeeEstimates } from '../../store/actions/fees';
import { keepLdkSynced, setupLdk } from '../lightning';
import { setupBlocktank, watchPendingOrders } from '../blocktank';
import { updateSlashPayConfig2 } from '../slashtags2';
import { Slashtag } from '../../hooks/slashtags';
import { performFullRestoreFromLatestBackup } from '../../store/actions/backup';
import { promiseTimeout } from '../helpers';
import { TAvailableNetworks } from '../networks';
import { TWalletName } from '../../store/types/wallet';
import { runChecks } from '../wallet/checks';

/**
 * Creates a new wallet from scratch
 * @returns {Promise<Result<string>>}
 */
export const createNewWallet = async ({
	bip39Passphrase,
}: {
	bip39Passphrase?: string;
} = {}): Promise<Result<string>> => {
	const mnemonic = await generateMnemonic();
	if (!mnemonic) {
		return err('Unable to generate mnemonic.');
	}
	const createRes = await createWallet({ mnemonic, bip39Passphrase });
	if (createRes.isErr()) {
		return err(createRes.error.message);
	}
	return ok('Wallet created');
};

export const restoreSeed = async ({
	mnemonic,
	bip39Passphrase,
}: {
	mnemonic: string;
	bip39Passphrase?: string;
}): Promise<Result<string>> => {
	const res = await createWallet({
		mnemonic,
		bip39Passphrase,
		restore: true,
		addressAmount: 25,
		changeAddressAmount: 25,
	});
	if (res.isErr()) {
		return res;
	}
	return ok('Seed restored');
};

export const restoreRemoteBackups = async (
	slashtag: Slashtag,
): Promise<Result<string>> => {
	const res = await performFullRestoreFromLatestBackup(slashtag);
	if (res.isErr()) {
		return err(res.error);
	}
	// Only set restore to true if we found that a backup exists to restore with.
	return await startWalletServices({ restore: res.value.backupExists });
};

/**
 * Starts all wallet services
 * @returns {Promise<Result<string>>}
 */
const ENABLE_SERVICES = true;
export const startWalletServices = async ({
	onchain = ENABLE_SERVICES,
	lightning = ENABLE_SERVICES,
	restore = false,
	staleBackupRecoveryMode = false,
	selectedWallet,
	selectedNetwork,
}: {
	onchain?: boolean;
	lightning?: boolean;
	restore?: boolean;
	staleBackupRecoveryMode?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<Result<string>> => {
	try {
		// wait for interactions/animations to be completed
		await new Promise((resolve) => {
			InteractionManager.runAfterInteractions(() => resolve(null));
		});
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		let isConnectedToElectrum = false;

		await promiseTimeout(2500, setupBlocktank(selectedNetwork));
		await promiseTimeout(2500, refreshBlocktankInfo());
		updateExchangeRates().then();

		// Before we do anything we should connect to an Electrum server
		if (onchain || lightning) {
			const electrumResponse = await connectToElectrum({
				showNotification: !restore,
				selectedNetwork,
			});
			if (electrumResponse.isOk()) {
				isConnectedToElectrum = true;
				// Ensure the on-chain wallet & LDK syncs when a new block is detected.
				const onReceive = (): void => {
					refreshWallet({
						onchain,
						lightning,
						selectedWallet,
						selectedNetwork,
					});
				};
				// Ensure we are subscribed to and save new header information.
				subscribeToHeader({ selectedNetwork, onReceive }).then();
			}
		}

		const mnemonicResponse = await getMnemonicPhrase();
		if (mnemonicResponse.isErr()) {
			return err(mnemonicResponse.error.message);
		}
		const mnemonic = mnemonicResponse.value;

		const walletExists = getWalletStore()?.walletExists;
		if (!walletExists) {
			const bip39Passphrase = await getBip39Passphrase();
			const createRes = await createWallet({ mnemonic, bip39Passphrase });
			if (createRes.isErr()) {
				return err(createRes.error.message);
			}
		}

		// Setup LDK
		if (lightning && isConnectedToElectrum) {
			const setupResponse = await setupLdk({
				selectedNetwork,
				shouldRefreshLdk: false,
				staleBackupRecoveryMode,
				shouldPreemptivelyStopLdk: false,
			});
			if (setupResponse.isOk()) {
				keepLdkSynced({ selectedNetwork }).then();
			}
		}

		if (onchain || lightning) {
			await Promise.all([
				updateOnchainFeeEstimates({ selectedNetwork, forceUpdate: true }),
				// if we restore wallet, we need to generate addresses for all types
				refreshWallet({
					onchain: isConnectedToElectrum,
					lightning: isConnectedToElectrum,
					scanAllAddresses: restore,
					updateAllAddressTypes: true, // Ensure we scan all address types when spinning up the app.
					showNotification: !restore,
				}),
			]);
			await runChecks({ selectedWallet, selectedNetwork });
		}

		if (lightning) {
			watchPendingOrders();
		}

		// Refresh slashpay config
		updateSlashPayConfig2({ selectedNetwork, forceUpdate: true });

		return ok('Wallet started');
	} catch (e) {
		return err(e);
	}
};
