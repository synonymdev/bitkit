import { generateMnemonic, getMnemonicPhrase, refreshWallet } from '../wallet';
import {
	createWallet,
	updateExchangeRates,
	updateWallet,
} from '../../store/actions/wallet';
import { err, ok, Result } from '@synonymdev/result';
import { InteractionManager } from 'react-native';
import { getStore } from '../../store/helpers';
import { showErrorNotification } from '../notifications';
import {
	refreshBlocktankInfo,
	refreshServiceList,
} from '../../store/actions/blocktank';
import { setupTodos } from '../todos';
import { connectToElectrum, subscribeToHeader } from '../wallet/electrum';
import { updateOnchainFeeEstimates } from '../../store/actions/fees';
import { keepLdkSynced, setupLdk } from '../lightning';
import { updateUser } from '../../store/actions/user';
import { setupBlocktank, watchPendingOrders } from '../blocktank';
import { removeExpiredLightningInvoices } from '../../store/actions/lightning';
import { setupNodejsMobile } from '../nodejs-mobile';
import { updateSlashPayConfig } from '../slashtags';
import { sdk } from '../../components/SlashtagsProvider';
import { Slashtag } from '../../hooks/slashtags';
import { performFullRestoreFromLatestBackup } from '../../store/actions/backup';

/**
 * Checks if the specified wallet's phrase is saved to storage.
 */
const checkWalletExists = async (wallet = 'wallet0'): Promise<boolean> => {
	try {
		const response = await getMnemonicPhrase(wallet);
		const mnemonicExists = response.isOk() && !!response.value;
		const walletExists = getStore()?.wallet?.walletExists;
		return mnemonicExists && walletExists;
	} catch (e) {
		return false;
	}
};

/**
 * Creates a new wallet from scratch
 * @returns {Promise<Result<string>>}
 */
export const createNewWallet = async (): Promise<Result<string>> => {
	//All seeds will get automatically created
	return await startWalletServices({});
};

export const restoreSeed = async ({
	mnemonic,
}: {
	mnemonic: string;
}): Promise<Result<string>> => {
	const res = await createWallet({ mnemonic });
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

	return await startWalletServices({ restore: true });
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
}: {
	onchain?: boolean;
	lightning?: boolean;
	restore?: boolean;
}): Promise<Result<string>> => {
	try {
		InteractionManager.runAfterInteractions(async () => {
			const { selectedNetwork } = getStore().wallet;
			let isConnectedToElectrum = false;

			await setupBlocktank(selectedNetwork);
			await refreshBlocktankInfo();
			updateExchangeRates().then();

			// Before we do anything we should connect to an Electrum server
			if (onchain || lightning) {
				const electrumResponse = await connectToElectrum({ selectedNetwork });
				if (electrumResponse.isErr()) {
					showErrorNotification({
						title: 'Unable to connect to Electrum Server',
						message:
							electrumResponse?.error?.message ??
							'Unable to connect to Electrum Server',
					});
				} else {
					isConnectedToElectrum = true;
					// Ensure the on-chain wallet & LDK syncs when a new block is detected.
					const onReceive = (): void => {
						refreshWallet({ onchain, lightning });
					};
					// Ensure we are subscribed to and save new header information.
					await subscribeToHeader({ selectedNetwork, onReceive });
				}
				updateUser({ isConnectedToElectrum });
			}

			const walletExists = await checkWalletExists();

			let mnemonic;
			if (!walletExists) {
				// Generate new wallet if none exists
				mnemonic = await generateMnemonic();
				if (!mnemonic) {
					return err('Unable to generate mnemonic.');
				}
				await updateWallet({ walletExists: true });
			}

			await createWallet({ mnemonic });

			await setupNodejsMobile({});

			// Setup LDK
			if (lightning && isConnectedToElectrum) {
				const setupResponse = await setupLdk({
					selectedNetwork,
					shouldRefreshLdk: false,
				});
				if (setupResponse.isOk()) {
					keepLdkSynced({ selectedNetwork }).then();
				} else {
					showErrorNotification({
						title: 'Unable to start LDK.',
						message: setupResponse.error.message,
					});
				}
			}

			if (onchain || lightning) {
				await Promise.all([
					updateOnchainFeeEstimates({ selectedNetwork }),
					// if we restore wallet, we need to generate addresses for all types
					refreshWallet({
						onchain: isConnectedToElectrum,
						lightning: isConnectedToElectrum,
						updateAllAddressTypes: restore,
					}),
				]);
			}

			if (lightning) {
				await refreshServiceList();
				watchPendingOrders();
				removeExpiredLightningInvoices({
					selectedNetwork,
				}).then();
			}

			// Refresh slashpay config
			updateSlashPayConfig(sdk);

			// This should be last so that we know all on-chain and lightning data is synced/up-to-date.
			setupTodos().then();
		});

		return ok('Wallet started');
	} catch (e) {
		return err(e);
	}
};
