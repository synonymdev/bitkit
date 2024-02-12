import { EmitterSubscription, InteractionManager } from 'react-native';
import Keychain from 'react-native-keychain';
import * as bitcoin from 'bitcoinjs-lib';
import RNFS from 'react-native-fs';
import { err, ok, Result } from '@synonymdev/result';
import { TBroadcastTransaction } from '@synonymdev/react-native-ldk/dist/utils/types';
import { TGetAddressHistory } from 'beignet';
import lm, {
	ldk,
	DefaultTransactionDataShape,
	defaultUserConfig,
	EEventTypes,
	ENetworks,
	TAccount,
	TChannel,
	TChannelManagerClaim,
	TChannelManagerPaymentSent,
	TChannelUpdate,
	TClaimableBalance,
	TCloseChannelReq,
	TCreatePaymentReq,
	THeader,
	TInvoice,
	TPaymentReq,
	TTransactionData,
	TTransactionPosition,
	TGetFees,
	TBackupStateUpdate,
} from '@synonymdev/react-native-ldk';

import {
	getBlockHeader,
	getBlockHex,
	getTransactionMerkle,
	transactionExists,
} from '../wallet/electrum';
import {
	getCurrentAddressIndex,
	getMnemonicPhrase,
	getOnChainWalletData,
	getOnChainWalletElectrum,
	getSelectedNetwork,
	getSelectedWallet,
} from '../wallet';
import { EAvailableNetwork } from '../networks';
import {
	dispatch,
	getBlocktankStore,
	getFeesStore,
	getLightningStore,
	getStore,
	getWalletStore,
} from '../../store/helpers';
import { defaultHeader } from '../../store/shapes/wallet';
import {
	updateBackupState,
	updateLdkAccountVersion,
	updateLightningNodeId,
} from '../../store/slices/lightning';
import {
	moveMetaIncPaymentTags,
	removePeer,
	syncLightningTxsWithActivityList,
	updateClaimableBalancesThunk,
	updateLightningChannelsThunk,
	updateLightningNodeIdThunk,
	updateLightningNodeVersionThunk,
} from '../../store/utils/lightning';
import { promiseTimeout, reduceValue, sleep, tryNTimes } from '../helpers';
import {
	EActivityType,
	TLightningActivityItem,
} from '../../store/types/activity';
import { addActivityItem } from '../../store/slices/activity';
import { addCJitActivityItem } from '../../store/utils/activity';
import {
	EPaymentType,
	ETransferStatus,
	ETransferType,
	IWalletItem,
	TWalletName,
} from '../../store/types/wallet';
import { closeSheet, updateUi } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import { updateSlashPayConfig2 } from '../slashtags2';
import {
	TLdkAccountVersion,
	TLightningNodeVersion,
} from '../../store/types/lightning';
import { getBlocktankInfo, isGeoBlocked } from '../blocktank';
import { updateOnchainFeeEstimates } from '../../store/utils/fees';
import { reportLdkChannelMigrations } from '../checks';
import {
	__BACKUPS_SERVER_HOST__,
	__BACKUPS_SERVER_PUBKEY__,
	__TRUSTED_ZERO_CONF_PEERS__,
} from '../../constants/env';
import { addTransfer } from '../../store/actions/wallet';
import { decodeRawTx } from '../wallet/txdecoder';

let LDKIsStayingSynced = false;

export const DEFAULT_LIGHTNING_PEERS: IWalletItem<string[]> = {
	bitcoin: [],
	bitcoinRegtest: [],
	bitcoinTestnet: [],
};

export const FALLBACK_BLOCKTANK_PEERS: IWalletItem<string[]> = {
	bitcoin: [
		'0296b2db342fcf87ea94d981757fdf4d3e545bd5cef4919f58b5d38dfdd73bf5c9@130.211.95.29:9735',
	],
	bitcoinRegtest: [
		'03b9a456fb45d5ac98c02040d39aec77fa3eeb41fd22cf40b862b393bcfc43473a@35.233.47.252:9400',
	],
	bitcoinTestnet: [],
};

let paymentSubscription: EmitterSubscription | undefined;
let onChannelSubscription: EmitterSubscription | undefined;
let onSpendableOutputsSubscription: EmitterSubscription | undefined;
let onBackupStateUpdate: EmitterSubscription | undefined;

/**
 * Wipes LDK data from storage
 * @returns {Promise<Result<string>>}
 */
export const wipeLdkStorage = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	await ldk.stop();
	const path = `${RNFS.DocumentDirectoryPath}/ldk/${lm.account.name}`;

	const deleteAllFiles = async (dirpath: string): Promise<void> => {
		const items = await RNFS.readDir(dirpath);
		for (const item of items) {
			if (item.isFile()) {
				await RNFS.unlink(item.path);
			} else {
				await deleteAllFiles(item.path);
			}
		}
	};

	try {
		// delete all files in the directory
		// NOTE: this is a workaround for RNFS.unlink(folder) freezing the app
		await deleteAllFiles(path);
	} catch (e) {
		return err(e);
	}

	return ok(`${selectedNetwork}'s LDK directory wiped for ${selectedWallet}`);
};

const LDK_ACCOUNT_SUFFIX_V1 = 'ldkaccount';
const LDK_ACCOUNT_SUFFIX_V2 = 'ldkaccountv2';

export const setLdkStoragePath = (): Promise<Result<string>> =>
	lm.setBaseStoragePath(`${RNFS.DocumentDirectoryPath}/ldk/`);

const broadcastTransaction: TBroadcastTransaction = async (
	rawTx: string,
): Promise<Result<string>> => {
	const electrum = getOnChainWalletElectrum();
	const res = await electrum.broadcastTransaction({
		rawTx,
		subscribeToOutputAddress: false,
	});
	if (res.isErr()) {
		return err('');
	}

	const transaction = decodeRawTx(rawTx, bitcoin.networks.regtest);

	// TODO: distinguish between different coop and force-close
	addTransfer({
		txId: transaction.txid,
		type: ETransferType.coopClose,
		status: ETransferStatus.pending,
		amount: transaction.outputs[0].satoshi,
		confirmations: 0,
	});

	return ok(res.value);
};

const getScriptPubKeyHistory = async (
	scriptPubKey: string,
): Promise<TGetAddressHistory[]> => {
	const electrum = getOnChainWalletElectrum();
	return await electrum.getScriptPubKeyHistory(scriptPubKey);
};

const getFees: TGetFees = async () => {
	const fees = getFeesStore().onchain;
	return {
		//https://github.com/lightningdevkit/rust-lightning/blob/main/CHANGELOG.md#api-updates
		onChainSweep: fees.fast,
		maxAllowedNonAnchorChannelRemoteFee: Math.max(25, fees.fast * 10),
		minAllowedAnchorChannelRemoteFee: fees.minimum,
		minAllowedNonAnchorChannelRemoteFee: Math.max(fees.minimum - 1, 0),
		anchorChannelFee: fees.slow,
		nonAnchorChannelFee: fees.normal,
		channelCloseMinimum: fees.minimum,
	};
};

/**
 * Used to spin-up LDK services.
 * In order, this method:
 * 1. Fetches and sets the genesis hash.
 * 2. Retrieves and sets the seed from storage.
 * 3. Starts ldk with the necessary params.
 * 5. Syncs LDK.
 */
export const setupLdk = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
	shouldRefreshLdk = true,
	staleBackupRecoveryMode = false,
	shouldPreemptivelyStopLdk = true,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	shouldRefreshLdk?: boolean;
	staleBackupRecoveryMode?: boolean;
	shouldPreemptivelyStopLdk?: boolean;
} = {}): Promise<Result<string>> => {
	try {
		pendingRefreshPromises = [];
		isRefreshing = false;

		if (shouldPreemptivelyStopLdk) {
			// start from a clean slate
			await ldk.stop();
			dispatch(updateUi({ isLDKReady: false }));
		}

		const accountVersion = await checkAccountVersion(
			selectedWallet,
			selectedNetwork,
		);

		const account = await getLdkAccount({
			version: accountVersion,
			selectedWallet,
			selectedNetwork,
		});
		if (account.isErr()) {
			return err(account.error.message);
		}
		let network: ENetworks;
		switch (selectedNetwork) {
			case 'bitcoin':
				network = ENetworks.mainnet;
				break;
			case 'bitcoinTestnet':
				network = ENetworks.testnet;
				break;
			default:
				network = ENetworks.regtest;
				break;
		}
		const getAddress = async (): Promise<{
			address: string;
			publicKey: string;
		}> => {
			const error = { address: '', publicKey: '' };
			try {
				const addressIndex = await getCurrentAddressIndex({});
				if (addressIndex.isErr()) {
					return error;
				}
				return {
					address: addressIndex.value.address,
					publicKey: addressIndex.value.publicKey,
				};
			} catch {
				console.error('Error getting address for LDK');
				//TODO react-native-ldk should be updated to handle errors where an address cannot be generated
				return error;
			}
		};

		const storageRes = await setLdkStoragePath();
		if (storageRes.isErr()) {
			return err(storageRes.error);
		}
		const rapidGossipSyncUrl = getStore().settings.rapidGossipSyncUrl;
		const backupRes = await ldk.backupSetup({
			network,
			seed: account.value.seed,
			details: {
				host: __BACKUPS_SERVER_HOST__,
				serverPubKey: __BACKUPS_SERVER_PUBKEY__,
			},
		});
		if (backupRes.isErr()) {
			return err(backupRes.error);
		}

		const lmStart = await lm.start({
			account: account.value,
			getFees,
			network,
			getBestBlock,
			getAddress,
			broadcastTransaction,
			getTransactionData,
			getScriptPubKeyHistory,
			getTransactionPosition,
			forceCloseOnStartup: {
				forceClose: staleBackupRecoveryMode,
				broadcastLatestTx: false,
			},
			userConfig: {
				...defaultUserConfig,
				channel_handshake_config: {
					...defaultUserConfig.channel_handshake_config,
					negotiate_anchors_zero_fee_htlc_tx: true,
				},
				manually_accept_inbound_channels: true,
			},
			trustedZeroConfPeers: __TRUSTED_ZERO_CONF_PEERS__,
			rapidGossipSyncUrl,
			skipParamCheck: true, //Switch off for debugging LDK networking issues
		});

		if (lmStart.isErr()) {
			return err(lmStart.error.message);
		}

		await Promise.all([
			updateLightningNodeIdThunk(),
			updateLightningNodeVersionThunk(),
			removeUnusedPeers({ selectedWallet, selectedNetwork }),
		]);
		if (shouldRefreshLdk) {
			await refreshLdk({ selectedWallet, selectedNetwork });
		}

		subscribeToLightningPayments({
			selectedWallet,
			selectedNetwork,
		});

		await handleAccountMigrations({
			accountVersion,
			selectedWallet,
			selectedNetwork,
		});

		return ok('Successfully started LDK.');
	} catch (e) {
		return err(e.toString());
	}
};

export const restartLdk = async (): Promise<Result<string>> => {
	// wait for interactions/animations to be completed
	await new Promise((resolve) => {
		InteractionManager.runAfterInteractions(() => resolve(null));
	});

	return ldk.restart();
};

/**
 * Retrieves any pending/unpaid invoices from the invoices array via payment hash.
 * TODO replace this function once this is complete https://github.com/synonymdev/react-native-ldk/issues/152
 * @param {string} paymentHash
 */
export const getPendingInvoice = (
	paymentHash: string,
): Promise<TInvoice | undefined> => lm.getInvoiceFromPaymentHash(paymentHash);

export const handleLightningPaymentSubscription = async ({
	payment,
	selectedWallet,
	selectedNetwork,
}: {
	payment: TChannelManagerClaim;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<void> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const invoice = await getPendingInvoice(payment.payment_hash);

	let message = '';
	let address = '';

	//If we have the invoice add those details to the activity item for instant display
	//If we don't have the invoice we can still add details and show received animation
	if (invoice) {
		message = invoice.description ?? '';
		address = invoice.to_str;

		moveMetaIncPaymentTags(invoice);
	} else {
		//Unlikely to happen and not really a problem if it does
		console.error(
			"Couldn't find invoice for claimed payment: ",
			payment.payment_hash,
		);
	}

	const activityItem: TLightningActivityItem = {
		id: payment.payment_hash,
		activityType: EActivityType.lightning,
		txType: EPaymentType.received,
		message,
		address,
		value: payment.amount_sat,
		confirmed: true,
		timestamp: new Date().getTime(),
	};

	dispatch(addActivityItem(activityItem));
	showBottomSheet('newTxPrompt', { activityItem });
	dispatch(closeSheet('receiveNavigation'));

	await refreshLdk({ selectedWallet, selectedNetwork });
	updateSlashPayConfig2({ selectedWallet, selectedNetwork });
};

/**
 * Subscribes to incoming lightning payments.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const subscribeToLightningPayments = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): void => {
	if (!paymentSubscription) {
		paymentSubscription = ldk.onEvent(
			EEventTypes.channel_manager_payment_claimed,
			(res: TChannelManagerClaim) => {
				if (!selectedWallet) {
					selectedWallet = getSelectedWallet();
				}
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}

				handleLightningPaymentSubscription({
					payment: res,
					selectedNetwork,
					selectedWallet,
				}).then();
			},
		);
	}
	if (!onChannelSubscription) {
		onChannelSubscription = ldk.onEvent(
			EEventTypes.new_channel,
			async (_res: TChannelUpdate) => {
				// New Channel will open in 1 block confirmation

				if (!selectedWallet) {
					selectedWallet = getSelectedWallet();
				}
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}

				await refreshLdk({ selectedWallet, selectedNetwork });

				// Check if this is a CJIT Entry that needs to be added to the activity list.
				addCJitActivityItem(_res.channel_id).then();
			},
		);
	}
	if (!onSpendableOutputsSubscription) {
		onSpendableOutputsSubscription = ldk.onEvent(
			EEventTypes.channel_manager_spendable_outputs,
			() => {},
		);
	}
	if (!onBackupStateUpdate) {
		onBackupStateUpdate = ldk.onEvent(
			EEventTypes.backup_state_update,
			(res: TBackupStateUpdate) => {
				if (!selectedWallet) {
					selectedWallet = getSelectedWallet();
				}
				if (!selectedNetwork) {
					selectedNetwork = getSelectedNetwork();
				}

				dispatch(
					updateBackupState({
						backup: res,
						selectedWallet,
						selectedNetwork,
					}),
				);
			},
		);
	}
};

export const unsubscribeFromLightningSubscriptions = (): void => {
	paymentSubscription?.remove();
	onChannelSubscription?.remove();
	onSpendableOutputsSubscription?.remove();
	onBackupStateUpdate?.remove();
};

let isRefreshing = false;
let pendingRefreshPromises: Array<(result: Result<string>) => void> = [];

const resolveAllPendingRefreshPromises = (result: Result<string>): void => {
	isRefreshing = false;
	while (pendingRefreshPromises.length > 0) {
		const resolve = pendingRefreshPromises.shift();
		if (resolve) {
			resolve(result);
		}
	}
};

const handleRefreshError = (errorMessage: string): Result<string> => {
	isRefreshing = false;
	resolveAllPendingRefreshPromises(err(errorMessage));
	return err(errorMessage);
};

/**
 * This method syncs LDK, re-adds peers & updates lightning channels.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {boolean} [clearPendingRefreshPromises]
 * @returns {Promise<Result<string>>}
 */
export const refreshLdk = async ({
	selectedWallet,
	selectedNetwork,
	clearPendingRefreshPromises = false,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	clearPendingRefreshPromises?: boolean;
} = {}): Promise<Result<string>> => {
	if (clearPendingRefreshPromises) {
		pendingRefreshPromises = [];
		isRefreshing = false;
	}
	if (isRefreshing) {
		return new Promise((resolve) => {
			pendingRefreshPromises.push(resolve);
		});
	}
	isRefreshing = true;

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

		const isRunning = await isLdkRunning();
		if (!isRunning) {
			dispatch(updateUi({ isLDKReady: false }));
			// Attempt to setup and start LDK.
			const setupResponse = await setupLdk({
				selectedNetwork,
				selectedWallet,
				shouldRefreshLdk: false,
				shouldPreemptivelyStopLdk: false,
			});
			if (setupResponse.isErr()) {
				return handleRefreshError(setupResponse.error.message);
			}
			keepLdkSynced({ selectedNetwork }).then();
		}

		// Calls that don't require sequential execution.
		const promises: Promise<Result<any>>[] = [
			lm.syncLdk(),
			lm.setFees(),
			addPeers({ selectedNetwork, selectedWallet }),
		];
		const results = await Promise.all(promises);
		for (const result of results) {
			if (result.isErr()) {
				//Can fail, but we should still continue and make UI ready so payments can be attempted
				console.error(result.error.message);
			}
		}

		await Promise.all([
			updateLightningChannelsThunk({ selectedWallet, selectedNetwork }),
			syncLightningTxsWithActivityList(),
		]);

		await updateClaimableBalancesThunk();

		const accountVersion = getLightningStore()?.accountVersion;
		if (!accountVersion || accountVersion < 2) {
			// Attempt to migrate on refresh.
			await migrateToLdkV2Account(selectedWallet, selectedNetwork);
		}
		dispatch(updateUi({ isLDKReady: true }));

		resolveAllPendingRefreshPromises(ok(''));
		return ok('');
	} catch (e) {
		console.error(e);
		return handleRefreshError(e.message);
	}
};

/**
 * Use Keychain to save LDK name & seed to secure storage.
 * @param {string} name
 * @param {string} seed
 */
export const setAccount = async ({
	name,
	seed,
}: TAccount): Promise<boolean> => {
	try {
		if (!name) {
			name = getSelectedWallet();
			name = `${name}${LDK_ACCOUNT_SUFFIX_V2}`;
		}
		const account: TAccount = {
			name,
			seed,
		};
		const setRes = await Keychain.setGenericPassword(
			name,
			JSON.stringify(account),
			{
				service: name,
			},
		);
		if (!setRes) {
			return false;
		}
		return true;
	} catch {
		return false;
	}
};

/**
 * Checks if v1 account exists in storage. Otherwise, updates to v2.
 * @param {TWalletName} selectedWallet
 * @param {EAvailableNetwork} selectedNetwork
 * @returns {Promise<Result<string>>}
 */
export const checkAccountVersion = async (
	selectedWallet: TWalletName = getSelectedWallet(),
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
): Promise<TLdkAccountVersion> => {
	let accountVersion = getLightningStore().accountVersion;
	if (accountVersion === 1) {
		// Check if a v1 account exists in storage.
		const v1AccountExists = await getExistingLdkAccount({
			version: accountVersion,
			selectedWallet,
			selectedNetwork,
		});
		if (v1AccountExists.isErr()) {
			// If no v1 account exists in storage, update version number.
			dispatch(updateLdkAccountVersion(2));
			accountVersion = 2;
		}
	}
	return accountVersion;
};

/**
 * Retrieve LDK account info from storage.
 * @param {number} version
 * @param {boolean} shouldCreateAccount When set to true, it will create a new account if none is found.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getLdkAccount = async ({
	version = 2,
	shouldCreateAccount = true,
	selectedWallet,
	selectedNetwork,
}: {
	version?: TLdkAccountVersion;
	shouldCreateAccount?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<TAccount>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const existingAccountRes = await getExistingLdkAccount({
		version,
		selectedWallet,
		selectedNetwork,
	});
	if (existingAccountRes.isOk()) {
		// Return existing account.
		return existingAccountRes;
	}
	if (!shouldCreateAccount) {
		// Return error from getExistingLdkAccount instead of creating an account.
		return existingAccountRes;
	}

	// If no account was found, attempt to create one.
	return createDefaultLdkAccount({ version, selectedWallet, selectedNetwork });
};

export const createDefaultLdkAccount = async ({
	version,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	version: TLdkAccountVersion;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TAccount>> => {
	const mnemonicPhrase = await getMnemonicPhrase(selectedWallet);
	if (mnemonicPhrase.isErr()) {
		return err(mnemonicPhrase.error.message);
	}
	const name = getLdkAccountName({ version, selectedWallet, selectedNetwork });
	const defaultAccount = getDefaultLdkAccount({
		name,
		mnemonic: mnemonicPhrase.value,
		version,
	});
	// Setup default account.
	const setAccountResponse = await setAccount(defaultAccount);
	if (setAccountResponse) {
		return ok(defaultAccount);
	} else {
		return err('Unable to set LDK account.');
	}
};

/**
 * Returns existing LDK account from storage.
 * Returns error if none exist.
 * @param {TLdkAccountVersion} version
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TAccount>>}
 */
const getExistingLdkAccount = async ({
	version,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	version: TLdkAccountVersion;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TAccount>> => {
	const name = getLdkAccountName({ version, selectedWallet, selectedNetwork });
	const result = await Keychain.getGenericPassword({ service: name });
	if (!!result && result?.password) {
		// Return existing account.
		return ok(JSON.parse(result.password));
	}
	return err('No LDK account found.');
};

/**
 * Attempts to migrate LDK accounts to the next version.
 * @param {TLdkAccountVersion} accountVersion
 * @param {TWalletName} selectedWallet
 * @param {EAvailableNetwork} selectedNetwork
 * @returns {Promise<void>}
 */
const handleAccountMigrations = async ({
	accountVersion,
	selectedWallet,
	selectedNetwork,
}: {
	accountVersion: TLdkAccountVersion;
	selectedWallet: TWalletName;
	selectedNetwork: EAvailableNetwork;
}): Promise<void> => {
	if (accountVersion >= 2) {
		return;
	}
	if (!__DEV__ && selectedNetwork !== 'bitcoin') {
		// We only care about migrating mainnet accounts outside of development.
		return;
	}
	if (accountVersion === 1) {
		// Close v1 account and migrate to v2
		await closeLdkV1Account(selectedWallet, selectedNetwork);
	}
};

/**
 * Attempts to close all open channels and migrate to v2.
 * @param {TWalletName} selectedWallet
 * @param {EAvailableNetwork} selectedNetwork
 * @returns {Promise<Result<string>>}
 */
const closeLdkV1Account = async (
	selectedWallet,
	selectedNetwork,
): Promise<Result<string>> => {
	const openChannelsRes = await getOpenChannels({
		fromStorage: false,
		selectedNetwork,
		selectedWallet,
	});
	if (openChannelsRes.isErr()) {
		return err(openChannelsRes.error.message);
	}
	const channels = openChannelsRes.value;
	if (channels.length) {
		const closeRes = await closeAllChannels({
			channels,
			selectedWallet,
			selectedNetwork,
		});
		if (closeRes.isErr()) {
			return err(closeRes.error.message);
		}
		if (closeRes.value.length) {
			await reportLdkChannelMigrations({
				channels: closeRes.value,
				selectedNetwork,
			});
		}
		await sleep(1000);
		await lm.syncLdk();
		await sleep(1000);
	}
	return migrateToLdkV2Account(selectedWallet, selectedNetwork);
};

let isMigrating = false;
export const migrateToLdkV2Account = async (
	selectedWallet: TWalletName,
	selectedNetwork: EAvailableNetwork,
): Promise<Result<string>> => {
	if (isMigrating) {
		return err('Currently Migrating.');
	}
	isMigrating = true;
	try {
		if (!__DEV__ && selectedNetwork !== 'bitcoin') {
			return err('Only migrate if mainnet.');
		}
		const lightningBalance = getLightningBalance({
			selectedWallet,
			selectedNetwork,
			includeReserveBalance: true,
		});
		const openChannels = await getOpenChannels({
			selectedNetwork,
			selectedWallet,
		});
		if (openChannels.isErr()) {
			return err(openChannels.error.message);
		}
		const claimableBalances = await getClaimableBalances();
		const result = reduceValue(claimableBalances, 'amount_satoshis');
		const claimableBalance = result.isOk() ? result.value : 0;

		const nodeId = await getNodeId();
		if (nodeId.isErr()) {
			return err(nodeId.error.message);
		}

		if (
			lightningBalance.localBalance ||
			lightningBalance.remoteBalance ||
			claimableBalance ||
			openChannels.value.length
		) {
			return err('Not ready to migrate.');
		}

		const oldNodeId = await getNodeId();
		if (oldNodeId.isErr()) {
			return err(oldNodeId.error.message);
		}
		dispatch(updateLdkAccountVersion(2));
		await sleep(1000);
		await setupLdk({
			selectedWallet,
			selectedNetwork,
			shouldRefreshLdk: false,
		});
		// Ensure the LDK Account was created.
		const ldkAccount = await getLdkAccount({
			version: 2,
			selectedWallet,
			selectedNetwork,
		});
		if (ldkAccount.isErr()) {
			// Attempt to create the v2 account for the next retry.
			await createDefaultLdkAccount({
				version: 2,
				selectedWallet,
				selectedNetwork,
			});
			return err('Unable to get v2 LDK account.');
		}
		await ldk.stop();
		await sleep(1000);
		await refreshLdk({
			selectedWallet,
			selectedNetwork,
		});
		const newNodeId = await getNodeId();
		if (newNodeId.isErr()) {
			return err(newNodeId.error.message);
		}
		if (oldNodeId.value === newNodeId.value) {
			// Revert version to try again later.
			dispatch(updateLdkAccountVersion(1));
			return err('Failed to migrate to v2.');
		}
		dispatch(
			updateLightningNodeId({
				nodeId: newNodeId.value,
				selectedWallet,
				selectedNetwork,
			}),
		);
		return ok('Migrated to v2.');
	} catch (e) {
		return err(e);
	} finally {
		isMigrating = false;
	}
};

/**
 * Retrieves LDK account name for the provided version, wallet and network.
 * @param {TLdkAccountVersion} version
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {string}
 */
export const getLdkAccountName = ({
	version,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	version: TLdkAccountVersion;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string => {
	const suffix = version === 1 ? LDK_ACCOUNT_SUFFIX_V1 : LDK_ACCOUNT_SUFFIX_V2;
	return `${selectedWallet}${selectedNetwork}${suffix}`;
};

/**
 * Returns the default LDK account for the provided name, mnemonic & version.
 * @param {string} name
 * @param {string} mnemonic
 * @param {TLdkAccountVersion} version
 * @returns {TAccount}
 */
export const getDefaultLdkAccount = ({
	name,
	mnemonic,
	version,
}: {
	name: string;
	mnemonic: string;
	version: TLdkAccountVersion;
}): TAccount => {
	switch (version) {
		case 1:
			// @ts-ignore
			const ldkSeed = bitcoin.crypto.sha256(mnemonic).toString('hex');
			return {
				name,
				seed: ldkSeed,
			};
		case 2:
			return {
				name,
				seed: getSha256(mnemonic),
			};
		default:
			return {
				name,
				seed: getSha256(mnemonic),
			};
	}
};

/**
 * Get sha256 hash of a given string.
 * @param {string} str
 * @returns {string}
 */
export const getSha256 = (str: string): string => {
	const buffer = Buffer.from(str, 'utf8');
	const hash = bitcoin.crypto.sha256(buffer);
	return hash.toString('hex');
};

/**
 * Returns last known header information from storage.
 * @returns {Promise<THeader>}
 */
export const getBestBlock = async (
	selectedNetwork?: EAvailableNetwork,
): Promise<THeader> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	try {
		const beignetHeader = getOnChainWalletData().header;
		const storageHeader = getWalletStore().header[selectedNetwork];
		const header =
			beignetHeader.height > storageHeader.height
				? beignetHeader
				: storageHeader;
		return header?.height ? header : defaultHeader;
	} catch (e) {
		console.log(e);
		return defaultHeader;
	}
};

/**
 * Returns the transaction header, height and hex (transaction) for a given txid.
 * @param {string} txId
 * @returns {Promise<TTransactionData>}
 */
export const getTransactionData = async (
	txId: string = '',
): Promise<TTransactionData | undefined> => {
	let transactionData = DefaultTransactionDataShape;
	try {
		const data = [{ tx_hash: txId }];
		const electrum = getOnChainWalletElectrum();
		const response = await electrum.getTransactions({
			txHashes: data,
		});

		//Unable to reach Electrum server.
		if (response.isErr()) {
			return transactionData;
		}

		const txData = response.value.data[0];

		if (!transactionExists(txData)) {
			//Transaction was removed from the mempool or potentially reorg'd out of the chain.
			return undefined;
		}

		const {
			confirmations,
			hex: hex_encoded_tx,
			vout,
		} = response.value.data[0].result;
		const header = getBlockHeader();
		const currentHeight = header.height;
		let confirmedHeight = 0;
		if (confirmations) {
			confirmedHeight = currentHeight - confirmations + 1;
		}
		const hexEncodedHeader = await getBlockHex({
			height: confirmedHeight,
		});
		if (hexEncodedHeader.isErr()) {
			return transactionData;
		}
		const voutData = vout.map(({ n, value, scriptPubKey: { hex } }) => {
			return { n, hex, value };
		});
		return {
			header: hexEncodedHeader.value,
			height: confirmedHeight,
			transaction: hex_encoded_tx,
			vout: voutData,
		};
	} catch {
		return transactionData;
	}
};

/**
 * Returns the position/index of the provided tx_hash within a block.
 * @param {string} tx_hash
 * @param {number} height
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<number>}
 */
export const getTransactionPosition = async ({
	tx_hash,
	height,
}: {
	tx_hash: string;
	height: number;
}): Promise<TTransactionPosition> => {
	const response = await getTransactionMerkle({
		tx_hash,
		height,
	});
	if (response.error || isNaN(response.data?.pos) || response.data?.pos < 0) {
		return -1;
	}
	return response.data.pos;
};

/**
 * Check if LDK is running.
 * @returns {Promise<boolean>}
 */
export const isLdkRunning = async (): Promise<boolean> => {
	const getNodeIdResponse = await promiseTimeout<Result<string>>(
		2000,
		getNodeId(),
	);

	if (getNodeIdResponse.isOk()) {
		return true;
	} else {
		return false;
	}
};

/**
 * Pauses execution until LDK is setup.
 * @returns {Promise<void>}
 */
export const waitForLdk = async (): Promise<void> => {
	await tryNTimes({
		toTry: getNodeId,
		interval: 500,
	});
};

/**
 * Returns the current LDK node id.
 * @returns {Promise<Result<string>>}
 */
export const getNodeId = async (): Promise<Result<string>> => {
	try {
		return await ldk.nodeId();
	} catch (e) {
		return err(e);
	}
};

/**
 * Returns the current LDK node id from state
 */
export const getNodeIdFromStorage = (): string => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();
	return getLightningStore().nodes[selectedWallet].nodeId[selectedNetwork];
};

/**
 * Parses a lightning uri.
 * @param {string} str
 * @returns {{ publicKey: string; ip: string; port: number; }}
 */
export const parseUri = (
	str: string,
): Result<{
	publicKey: string;
	ip: string;
	port: number;
}> => {
	const uri = str.split('@');
	const publicKey = uri[0];
	if (uri.length !== 2) {
		return err('The URI appears to be invalid.');
	}
	const parsed = uri[1].split(':');
	if (parsed.length < 2) {
		return err('The URI appears to be invalid.');
	}
	const ip = parsed[0];
	const port = Number(parsed[1]);
	return ok({
		publicKey,
		ip,
		port,
	});
};

/**
 * Prompt LDK to add a specified peer.
 * @param {string} peer
 * @param {number} [timeout]
 */
export const addPeer = async ({
	peer,
	timeout = 2000,
}: {
	peer: string;
	timeout?: number;
}): Promise<Result<string>> => {
	const parsedUri = parseUri(peer);
	if (parsedUri.isErr()) {
		return err(parsedUri.error.message);
	}
	return await lm.addPeer({
		pubKey: parsedUri.value.publicKey,
		address: parsedUri.value.ip,
		port: parsedUri.value.port,
		timeout,
	});
};

/**
 * Returns previously saved lightning peers from storage. (Excludes Blocktank and other default lightning peers.)
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getCustomLightningPeers = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string[] => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const peers = getLightningStore().nodes[selectedWallet]?.peers;
	if (peers && selectedNetwork in peers) {
		return peers[selectedNetwork];
	}
	return [];
};

/**
 * Adds blocktank, default, and all custom lightning peers.
 * @returns {Promise<Result<string[]>>}
 */
export const addPeers = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string[]>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const geoBlocked = await isGeoBlocked(true);

		let blocktankNodeUris: string[] = [];
		// No need to add Blocktank peer if geo-blocked.
		if (!geoBlocked) {
			// Set Blocktank node uri array if able.
			blocktankNodeUris =
				getBlocktankStore()?.info?.nodes[0]?.connectionStrings ?? [];
			if (!blocktankNodeUris.length) {
				// Fall back to hardcoded Blocktank peer if the blocktankNodeUris array is empty.
				blocktankNodeUris = FALLBACK_BLOCKTANK_PEERS[selectedNetwork];
			}
		}
		const blocktankLightningPeers = blocktankNodeUris;
		const defaultLightningPeers = DEFAULT_LIGHTNING_PEERS[selectedNetwork];
		const customLightningPeers = getCustomLightningPeers({
			selectedNetwork,
			selectedWallet,
		});
		const peers = [
			...defaultLightningPeers,
			...blocktankLightningPeers,
			...customLightningPeers,
		];
		const addPeerRes = await Promise.all(
			peers.map(async (peer) => {
				const addPeerResponse = await addPeer({
					peer,
					timeout: 1000,
				});
				if (addPeerResponse.isErr()) {
					console.log(addPeerResponse.error.message);
					return addPeerResponse.error.message;
				}
				return addPeerResponse.value;
			}),
		);
		return ok(addPeerRes);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

export const getLightningNodePeers = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<string[]> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const geoBlocked = await isGeoBlocked(true);

		let blocktankNodeUris: string[] = [];
		// No need to add Blocktank peer if geo-blocked.
		if (!geoBlocked) {
			// Set Blocktank node uri array if able.
			blocktankNodeUris =
				getBlocktankStore()?.info?.nodes[0].connectionStrings ?? [];
			if (!blocktankNodeUris.length) {
				// Fall back to hardcoded Blocktank peer if the blocktankNodeUris array is empty.
				blocktankNodeUris = FALLBACK_BLOCKTANK_PEERS[selectedNetwork];
			}
		}
		const blocktankLightningPeers = blocktankNodeUris;
		const defaultLightningPeers = DEFAULT_LIGHTNING_PEERS[selectedNetwork];
		const customLightningPeers = getCustomLightningPeers({
			selectedNetwork,
			selectedWallet,
		});
		return [
			...defaultLightningPeers,
			...blocktankLightningPeers,
			...customLightningPeers,
		];
	} catch (e) {
		console.log(e);
		return [];
	}
};

/**
 * Returns an array of pending and open channels
 * @returns Promise<Result<TChannel[]>>
 */
export const getLightningChannels = (): Promise<Result<TChannel[]>> => {
	return ldk.listChannels();
};

/**
 * Returns an array of unconfirmed/pending lightning channels from either storage or directly from the LDK node.
 * CURRENTLY UNUSED
 * @param {boolean} [fromStorage]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TChannel[]>>}
 */
export const getPendingChannels = async ({
	fromStorage = false,
	selectedWallet,
	selectedNetwork,
}: {
	fromStorage?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TChannel[]>> => {
	let channels: TChannel[];
	if (fromStorage) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		const channelsStore =
			getLightningStore().nodes[selectedWallet].channels[selectedNetwork];
		channels = Object.values(channelsStore);
	} else {
		const channelsResponse = await getLightningChannels();
		if (channelsResponse.isErr()) {
			return err(channelsResponse.error.message);
		}
		channels = channelsResponse.value;
	}
	const pendingChannels = channels.filter(
		(channel) => !channel.is_channel_ready,
	);
	return ok(pendingChannels);
};

/**
 * Returns an array of confirmed/open lightning channels from either storage or LDK directly..
 * @returns {Promise<Result<TChannel[]>>}
 */
export const getOpenChannels = async ({
	fromStorage = false,
	selectedWallet,
	selectedNetwork,
}: {
	fromStorage?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<TChannel[]>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	let channels: TChannel[];
	const node = getLightningStore().nodes[selectedWallet];

	if (fromStorage) {
		channels = Object.values(node.channels[selectedNetwork]);
	} else {
		const getChannelsResponse = await getLightningChannels();
		if (getChannelsResponse.isErr()) {
			return err(getChannelsResponse.error.message);
		}
		channels = getChannelsResponse.value;
	}

	const openChannelIds = node.openChannelIds[selectedNetwork];
	const openChannels = channels.filter((channel) => {
		return openChannelIds.includes(channel.channel_id);
	});

	return ok(openChannels);
};

/**
 * Returns LDK and c-bindings version.
 * @returns {Promise<Result<TLightningNodeVersion>}
 */
export const getNodeVersion = (): Promise<Result<TLightningNodeVersion>> => {
	return ldk.version();
};

/**
 * Attempts to close a channel given its channelId and counterPartyNodeId.
 * @param {string} channelId
 * @param {string} counterPartyNodeId
 * @param {boolean} [force]
 */
export const closeChannel = async ({
	channelId,
	counterPartyNodeId,
	force = false,
}: TCloseChannelReq): Promise<Result<string>> => {
	try {
		// Ensure we're fully up-to-date.
		await refreshLdk();
		return await ldk.closeChannel({ channelId, counterPartyNodeId, force });
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Attempts to close all known channels.
 * It will always attempt to coop close channels first and only force close if set to true.
 * Returns an array of channels it was not able to successfully close.
 * @param {TChannel[]} [channels]
 * @param {boolean} [force]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TChannel[]>>}
 */
export const closeAllChannels = async ({
	channels,
	force = false,
	selectedWallet,
	selectedNetwork,
}: {
	channels?: TChannel[];
	force?: boolean; // It will always try to coop close first and only force close if set to true.
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TChannel[]>> => {
	try {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!channels) {
			const openChannelsRes = await getOpenChannels({
				fromStorage: true,
				selectedNetwork,
				selectedWallet,
			});
			if (openChannelsRes.isErr()) {
				return err(openChannelsRes.error.message);
			}
			channels = openChannelsRes.value;
		}

		// Ensure we're fully up-to-date.
		const refreshRes = await refreshLdk({ selectedWallet, selectedNetwork });
		if (refreshRes.isErr()) {
			return err(refreshRes.error.message);
		}

		// Update fees before closing channels
		await updateOnchainFeeEstimates({ selectedNetwork, forceUpdate: true });

		const channelsUnableToCoopClose: TChannel[] = [];
		await Promise.all(
			channels.map(async (channel) => {
				const { channel_id, counterparty_node_id } = channel;
				const closeResponse = await closeChannel({
					channelId: channel_id,
					counterPartyNodeId: counterparty_node_id,
					force: false,
				});
				if (closeResponse.isErr()) {
					channelsUnableToCoopClose.push(channel);
				}
			}),
		);

		if (!force) {
			// Finished coop closing channels.
			// Return channels we weren't able to close, if any.
			return ok(channelsUnableToCoopClose);
		}

		// Attempt to force close the remaining channels
		const channelsUnableToForceClose: TChannel[] = [];
		await Promise.all(
			channelsUnableToCoopClose.map(async (channel) => {
				const { channel_id, counterparty_node_id } = channel;
				const closeResponse = await closeChannel({
					channelId: channel_id,
					counterPartyNodeId: counterparty_node_id,
					force: true,
				});
				if (closeResponse.isErr()) {
					channelsUnableToForceClose.push(channel);
				}
			}),
		);

		// Finished force closing channels.
		// Return channels we weren't able to force close, if any.
		return ok(channelsUnableToForceClose);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

/**
 * Attempts to create a bolt11 invoice.
 * @param {TCreatePaymentReq} req
 * @returns {Promise<Result<TInvoice>>}
 */
export const createPaymentRequest = (
	req: TCreatePaymentReq,
): Promise<Result<TInvoice>> => lm.createAndStorePaymentRequest(req);

/**
 * Attempts to pay a bolt11 invoice.
 * @param {string} invoice
 * @param {number} [sats]
 * @returns {Promise<Result<string>>}
 */
export const payLightningInvoice = async (
	invoice: string,
	sats?: number,
): Promise<Result<TChannelManagerPaymentSent>> => {
	try {
		const addPeersResponse = await addPeers();
		if (addPeersResponse.isErr()) {
			return err(addPeersResponse.error.message);
		}
		const decodedInvoice = await decodeLightningInvoice({
			paymentRequest: invoice,
		});
		if (decodedInvoice.isErr()) {
			return err(decodedInvoice.error.message);
		}

		const payResponse = await lm.payWithTimeout({
			paymentRequest: invoice,
			amountSats: sats ?? 0,
			timeout: 60000,
		});
		if (payResponse.isErr()) {
			//On occasion a payment can time out but still be pending, so we need to sync with react-native-ldk's stored pending payments
			await syncLightningTxsWithActivityList();
			return err(payResponse.error.message);
		}

		let value = decodedInvoice.value.amount_satoshis ?? 0;
		if (sats) {
			value = sats;
		}
		const activityItem: TLightningActivityItem = {
			id: decodedInvoice.value.payment_hash,
			activityType: EActivityType.lightning,
			txType: EPaymentType.sent,
			message: decodedInvoice.value.description ?? '',
			address: invoice,
			value,
			confirmed: true,
			fee: payResponse.value.fee_paid_sat ?? 0,
			timestamp: new Date().getTime(),
		};
		//TODO rather sync with ldk for txs
		dispatch(addActivityItem(activityItem));
		refreshLdk().then();
		return ok(payResponse.value);
	} catch (e) {
		console.log(e);
		return err(e);
	}
};

export const getClaimedLightningPayments = async (): Promise<
	TChannelManagerClaim[]
> => lm.getLdkPaymentsClaimed();

export const getSentLightningPayments = async (): Promise<
	TChannelManagerPaymentSent[]
> => lm.getLdkPaymentsSent();

export const decodeLightningInvoice = ({
	paymentRequest,
}: TPaymentReq): Promise<Result<TInvoice>> => {
	paymentRequest = paymentRequest.replace('lightning:', '').trim();
	return ldk.decode({ paymentRequest });
};

/**
 * Attempts to keep LDK in sync every 2-minutes.
 * @param {number} frequency
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const keepLdkSynced = async ({
	frequency = 120000,
	selectedWallet,
	selectedNetwork,
}: {
	frequency?: number;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<void> => {
	if (LDKIsStayingSynced) {
		return;
	} else {
		LDKIsStayingSynced = true;
	}
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	let error: string = '';
	while (!error) {
		const syncRes = await refreshLdk({ selectedNetwork, selectedWallet });
		if (!syncRes) {
			error = 'Unable to refresh LDK.';
			LDKIsStayingSynced = false;
			break;
		}
		await sleep(frequency);
	}
};

/**
 * Returns whether the user has any open lightning channels.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {boolean}
 */
export const hasOpenLightningChannels = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): boolean => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const availableChannels =
		getLightningStore().nodes[selectedWallet].openChannelIds[selectedNetwork];
	return availableChannels.length > 0;
};

export const rebroadcastAllKnownTransactions = async (): Promise<any> => {
	return await lm.rebroadcastAllKnownTransactions();
};

export const recoverOutputs = async (): Promise<Result<string>> => {
	return await lm.recoverOutputs();
};

/**
 * Returns total reserve balance for all open lightning channels.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<number>}
 */
export const getLightningReserveBalance = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): number => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const node = getLightningStore().nodes[selectedWallet];
	const openChannelIds = node.openChannelIds[selectedNetwork];
	const channels = node.channels[selectedNetwork];
	const openChannels = Object.values(channels).filter((channel) => {
		return openChannelIds.includes(channel.channel_id);
	});

	const result = reduceValue(openChannels, 'unspendable_punishment_reserve');
	const reserveBalances = result.isOk() ? result.value : 0;
	return reserveBalances;
};

/**
 * Returns the claimable balance for all lightning channels.
 * @param {boolean} [ignoreOpenChannels]
 * @returns {Promise<number>}
 */
export const getClaimableBalances = async ({
	ignoreOpenChannels = true,
}: {
	ignoreOpenChannels?: boolean;
} = {}): Promise<TClaimableBalance[]> => {
	const result = await ldk.claimableBalances(ignoreOpenChannels);
	const claimableBalances = result.isOk() ? result.value : [];
	return claimableBalances;
};

/**
 * Returns an array of peers that have been previously added and saved to storage.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getPeersFromStorage = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string[] => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return getLightningStore().nodes[selectedWallet].peers[selectedNetwork];
};

/**
 * Removes unused peers by comparing saved peers to the channel list to prevent unnecessarily connecting to them on subsequent startups.
 * Will ensure Blocktank's node is not removed if previously added.
 * TODO: This logic should be moved to react-native-ldk in future versions, but is handled here for now as a means to whitelist the Blocktank node and prevent disconnecting from Blocktank between channel purchase and channel open.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<string>>}
 */
export const removeUnusedPeers = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const getChannelsResponse = await getLightningChannels();
	if (getChannelsResponse.isErr()) {
		return err(getChannelsResponse.error.message);
	}
	const channels = getChannelsResponse.value;
	const channelNodeIds = channels.map(
		(channel) => channel.counterparty_node_id,
	);
	const blocktankInfo = await getBlocktankInfo(true);
	const blocktankPubKey = blocktankInfo.nodes[0].pubkey;
	const peers = await lm.getPeers();

	await Promise.all(
		peers.map((peer) => {
			if (
				!channelNodeIds.includes(peer.pubKey) && // If no channels exist for a given peer, remove them.
				peer.pubKey !== blocktankPubKey // Ensure we don't disconnect from Blocktank if it was previously added as a peer.
			) {
				const peerStr = `${peer.pubKey}@${peer.address}:${peer.port}`;
				// Remove peer from local storage.
				removePeer({ selectedWallet, selectedNetwork, peer: peerStr });
				// Instruct LDK to disconnect from peer.
				lm.removePeer({
					timeout: 5000,
					pubKey: peer.pubKey,
					address: peer.address,
					port: peer.port,
				}).then();
			}
		}),
	);
	return ok('Unused peers removed.');
};

/**
 * Returns the lightning balance of all known open and pending channels.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {boolean} [includeReserveBalance] Whether or not to include each channel's reserve balance (~1% per channel participant) in the returned balance.
 * @returns {{ localBalance: number; remoteBalance: number; }}
 */
export const getLightningBalance = ({
	selectedWallet,
	selectedNetwork,
	includeReserveBalance = true,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
	includeReserveBalance?: boolean;
}): {
	localBalance: number;
	remoteBalance: number;
} => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const node = getLightningStore().nodes[selectedWallet];
	const openChannelIds = node.openChannelIds[selectedNetwork];
	const channels = node.channels[selectedNetwork];
	const openChannels = openChannelIds.filter((channelId) => {
		const channel = channels[channelId];
		return channel.is_channel_ready;
	});

	const localBalance = Object.values(channels).reduce((acc, cur) => {
		if (openChannels.includes(cur.channel_id)) {
			if (!includeReserveBalance) {
				return acc + cur.outbound_capacity_sat;
			} else {
				return (
					acc +
					cur.outbound_capacity_sat +
					(cur.unspendable_punishment_reserve ?? 0)
				);
			}
		}
		return acc;
	}, 0);

	const remoteBalance = Object.values(channels).reduce((acc, cur) => {
		if (openChannelIds.includes(cur.channel_id)) {
			if (!includeReserveBalance) {
				return acc + cur.inbound_capacity_sat;
			} else {
				return (
					acc +
					cur.inbound_capacity_sat +
					(cur.unspendable_punishment_reserve ?? 0)
				);
			}
		}
		return acc;
	}, 0);

	return { localBalance, remoteBalance };
};
