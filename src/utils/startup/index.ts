import { generateMnemonic, getMnemonicPhrase, refreshWallet } from '../wallet';
import {
	createWallet,
	updateExchangeRates,
	updateWallet,
} from '../../store/actions/wallet';
import { err, ok, Result } from '@synonymdev/result';
import { InteractionManager } from 'react-native';
import { getStore } from '../../store/helpers';
//import { backupSetup, performFullBackup } from '../../store/actions/backup';
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
import { updateSlashPayConfig } from '../../utils/slashtags';
import { sdk } from '../../components/SlashtagsProvider';

/**
 * Checks if the specified wallet's phrase is saved to storage.
 */
export const checkWalletExists = async (
	wallet = 'wallet0',
): Promise<boolean> => {
	try {
		const response = await getMnemonicPhrase(wallet);
		let walletExists = false;
		if (response.isOk() && !!response.value) {
			walletExists = true;
		}
		const _walletExists = getStore()?.wallet?.walletExists;
		if (walletExists !== _walletExists) {
			await updateWallet({ walletExists });
		}
		return walletExists;
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

export const restoreWallet = async ({
	mnemonic,
}: {
	mnemonic: string;
}): Promise<Result<string>> => {
	const res = await createWallet({ mnemonic });
	if (res.isErr()) {
		return res;
	}
	return await startWalletServices({});
};

/*
// Callback passed to startLnd to be called after RPC is ready
const backupServiceStart = async (): Promise<void> => {
	const res = await backupSetup();
	if (res.isErr()) {
		showErrorNotification({
			title: 'Failed to verify remote backup. Retrying...',
			message: res.error.message,
		});
	}
	performFullBackup({ retries: 3, retryTimeout: 2000 }).then();
};*/

/**
 * Starts all wallet services
 * @returns {Promise<Result<string>>}
 */
const ENABLE_SERVICES = true;
export const startWalletServices = async ({
	onchain = ENABLE_SERVICES,
	lightning = ENABLE_SERVICES,
}: {
	onchain?: boolean;
	lightning?: boolean;
}): Promise<Result<string>> => {
	try {
		InteractionManager.runAfterInteractions(async () => {
			const { wallets, selectedNetwork } = getStore().wallet;
			let isConnectedToElectrum = false;

			updateExchangeRates().then();
			refreshBlocktankInfo().then();
			await setupNodejsMobile({});

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
			const walletKeys = Object.keys(wallets);
			if (!walletExists) {
				// Generate new wallet if none exists
				const mnemonic = await generateMnemonic();
				if (!mnemonic) {
					return err('Unable to generate mnemonic.');
				}
				await createWallet({ mnemonic });
			} else if (!wallets[walletKeys[0]]?.id) {
				// If we have a mnemonic in store, but not in redux, we need to init it
				const mnemonic = await getMnemonicPhrase();
				if (mnemonic.isErr()) {
					return err('Unable to get mnemonic.');
				}
				await createWallet({ mnemonic: mnemonic.value });
			}

			if (onchain || lightning) {
				await Promise.all([
					updateOnchainFeeEstimates({ selectedNetwork }),
					refreshWallet({ lightning }),
				]);

				// Setup LDK
				if (lightning) {
					const setupResponse = await setupLdk({ selectedNetwork });
					if (setupResponse.isOk()) {
						keepLdkSynced({ selectedNetwork }).then();
					} else {
						showErrorNotification({
							title: 'Unable to start LDK.',
							message: setupResponse.error.message,
						});
					}
				}
			}

			if (lightning) {
				await setupBlocktank(selectedNetwork);
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
			//backupServiceStart().then();
		});

		return ok('Wallet started');
	} catch (e) {
		return err(e);
	}
};
