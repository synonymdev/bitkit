import { InteractionManager } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import { generateMnemonic, TServer } from 'beignet';

import {
	getAddressTypesToMonitor,
	getBip39Passphrase,
	getGapLimitOptions,
	getMnemonicPhrase,
	getSelectedAddressType,
	getSelectedNetwork,
	getSelectedWallet,
	refreshWallet,
	setupOnChainWallet,
} from '../wallet';
import { createWallet } from '../../store/actions/wallet';
import { getWalletStore } from '../../store/helpers';
import { refreshBlocktankInfo } from '../../store/utils/blocktank';
import { keepLdkSynced, setupLdk } from '../lightning';
import { setupBlocktank, watchPendingOrders } from '../blocktank';
import { updateSlashPayConfig2 } from '../slashtags2';
import { Slashtag } from '../../hooks/slashtags';
import { performFullRestoreFromLatestBackup } from '../../store/utils/backup';
import { promiseTimeout } from '../helpers';
import { EAvailableNetwork } from '../networks';
import { TWalletName } from '../../store/types/wallet';
import { runChecks } from '../wallet/checks';
import { setupLedger, syncLedger } from '../ledger';

/**
 * Creates a new wallet from scratch
 * @returns {Promise<Result<string>>}
 */
export const createNewWallet = async ({
	bip39Passphrase,
}: {
	bip39Passphrase?: string;
} = {}): Promise<Result<string>> => {
	const mnemonic = generateMnemonic();
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
	selectedNetwork = getSelectedNetwork(),
	servers,
}: {
	mnemonic: string;
	bip39Passphrase?: string;
	selectedNetwork?: EAvailableNetwork;
	servers?: TServer | TServer[];
}): Promise<Result<string>> => {
	const res = await createWallet({
		mnemonic,
		bip39Passphrase,
		restore: true,
		selectedNetwork,
		servers,
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
	return ok('Remote Backups Restored');
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	onchain?: boolean;
	lightning?: boolean;
	restore?: boolean;
	staleBackupRecoveryMode?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	try {
		// wait for interactions/animations to be completed
		await new Promise((resolve) => {
			InteractionManager.runAfterInteractions(() => resolve(null));
		});
		promiseTimeout(2500, setupBlocktank(selectedNetwork)).then(() => {
			refreshBlocktankInfo().then();
		});

		setupLedger({ selectedWallet, selectedNetwork });

		const mnemonicResponse = await getMnemonicPhrase();
		if (mnemonicResponse.isErr()) {
			return err(mnemonicResponse.error.message);
		}
		const mnemonic = mnemonicResponse.value;
		const bip39Passphrase = await getBip39Passphrase();

		const walletExists = getWalletStore()?.walletExists;
		if (!walletExists) {
			const createRes = await createWallet({ mnemonic, bip39Passphrase });
			if (createRes.isErr()) {
				return err(createRes.error.message);
			}
		} else {
			const addressType = getSelectedAddressType({
				selectedWallet,
				selectedNetwork,
			});
			const addressTypesToMonitor = getAddressTypesToMonitor();
			const gapLimitOptions = getGapLimitOptions();
			const onChainSetupRes = await setupOnChainWallet({
				name: selectedWallet,
				selectedNetwork,
				bip39Passphrase,
				addressType,
				addressTypesToMonitor,
				gapLimitOptions,
			});
			if (onChainSetupRes.isErr()) {
				return err(onChainSetupRes.error.message);
			}
		}

		// Setup LDK
		if (lightning) {
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
			await refreshWallet({
				onchain: restore,
				lightning,
				scanAllAddresses: restore,
				showNotification: !restore,
			});
			await runChecks({ selectedWallet, selectedNetwork });
		}

		if (lightning) {
			watchPendingOrders();
		}

		// Refresh slashpay config
		updateSlashPayConfig2({ selectedNetwork, forceUpdate: true });

		syncLedger();

		return ok('Wallet started');
	} catch (e) {
		return err(e);
	}
};
