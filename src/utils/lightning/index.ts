import { EmitterSubscription, InteractionManager } from 'react-native';
import Keychain from 'react-native-keychain';
import * as bitcoin from 'bitcoinjs-lib';
import RNFS from 'react-native-fs';
import { err, ok, Result } from '@synonymdev/result';
import { EPaymentType, TGetAddressHistory } from 'beignet';
import lm, {
	ldk,
	defaultUserConfig,
	DefaultTransactionDataShape,
	EEventTypes,
	ENetworks,
	TAccount,
	TChannel as TLdkChannel,
	TBackupStateUpdate,
	TBroadcastTransaction,
	TChannelManagerChannelClosed,
	TChannelManagerClaim,
	TChannelManagerPaymentFailed,
	TChannelManagerPaymentSent,
	TChannelMonitor,
	TChannelUpdate,
	TClaimableBalance,
	TCloseChannelReq,
	TCreatePaymentReq,
	TGetFees,
	THeader,
	TInvoice,
	TPaymentReq,
	TTransactionData,
	TTransactionPosition,
} from '@synonymdev/react-native-ldk';

import {
	getBlockHeader,
	getBlockHex,
	getTransactionMerkle,
	transactionExists,
} from '../wallet/electrum';
import {
	getBip39Passphrase,
	getCurrentAddressIndex,
	getMnemonicPhrase,
	getOnChainWalletData,
	getOnChainWalletElectrum,
	getSelectedNetwork,
	getSelectedWallet,
	ldkSeed,
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
import { updateBackupState } from '../../store/slices/lightning';
import {
	moveMetaIncPaymentTags,
	removePeer,
	syncLightningTxsWithActivityList,
	closeChannelThunk,
	updateChannelsThunk,
	updateLightningNodeIdThunk,
	updateLightningNodeVersionThunk,
} from '../../store/utils/lightning';
import {
	promiseTimeout,
	reduceValue,
	sleep,
	tryNTimes,
	vibrate,
} from '../helpers';
import {
	EActivityType,
	TLightningActivityItem,
} from '../../store/types/activity';
import { addActivityItem } from '../../store/slices/activity';
import { addCJitActivityItem } from '../../store/utils/activity';
import { IWalletItem, TWalletName } from '../../store/types/wallet';
import { closeSheet, updateUi } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import { updateSlashPayConfig } from '../slashtags';
import {
	TLdkAccountVersion,
	TLightningNodeVersion,
	TChannel,
	EChannelStatus,
	EChannelClosureReason,
} from '../../store/types/lightning';
import { getBlocktankInfo, isGeoBlocked, logToBlocktank } from '../blocktank';
import { refreshOnchainFeeEstimates } from '../../store/utils/fees';
import {
	__BACKUPS_SERVER_HOST__,
	__BACKUPS_SERVER_PUBKEY__,
	__TRUSTED_ZERO_CONF_PEERS__,
} from '../../constants/env';
import { showToast } from '../notifications';
import i18n from '../i18n';
import { bitkitLedger, syncLedger } from '../ledger';

const PAYMENT_TIMEOUT = 8 * 1000; // 8 seconds

let LDKIsStayingSynced = false;

export const DEFAULT_LIGHTNING_PEERS: IWalletItem<string[]> = {
	bitcoin: [],
	bitcoinRegtest: [],
	bitcoinTestnet: [],
};

export const FALLBACK_BLOCKTANK_PEERS: IWalletItem<string[]> = {
	bitcoin: [
		'039b8b4dd1d88c2c5db374290cda397a8f5d79f312d6ea5d5bfdfc7c6ff363eae3@34.65.111.104:9735',
		'03342eac98d8c07ac8a4f303b2ad09a34b3350357730013d534d0537a4d1d8a14d@34.65.217.210:9735',
	],
	bitcoinRegtest: [
		'03b9a456fb45d5ac98c02040d39aec77fa3eeb41fd22cf40b862b393bcfc43473a@35.233.47.252:9400',
	],
	bitcoinTestnet: [],
};

// let paymentPathSuccessSubscription: EmitterSubscription | undefined;
// let paymentPathFailedSubscription: EmitterSubscription | undefined;
let paymentSentSubscription: EmitterSubscription | undefined;
let paymentFailedSubscription: EmitterSubscription | undefined;
let paymentClaimedSubscription: EmitterSubscription | undefined;
let onChannelSubscription: EmitterSubscription | undefined;
let onChannelClose: EmitterSubscription | undefined;
// let onSpendableOutputsSubscription: EmitterSubscription | undefined;
let onBackupStateUpdate: EmitterSubscription | undefined;

/**
 * Wipes LDK data from storage
 * @returns {Promise<Result<string>>}
 */
export const wipeLdkStorage = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
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

const LDK_ACCOUNT_SUFFIX_V3 = 'ldkaccountv3';

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

		const account = await getLdkAccount({
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
			lspLogEvent: async (payload) => {
				await logToBlocktank(payload.nodeId, JSON.stringify(payload.body));
			},
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
			const refreshRes = await refreshLdk({ selectedWallet, selectedNetwork });
			if (refreshRes.isErr()) {
				return err(refreshRes.error.message);
			}
		}

		subscribeToLightningPayments({
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	payment: TChannelManagerClaim;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<void> => {
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
		status: 'successful',
		message,
		address,
		value: payment.amount_sat,
		confirmed: true,
		timestamp: new Date().getTime(),
	};

	vibrate({ type: 'default' });
	showBottomSheet('newTxPrompt', { activityItem });
	dispatch(closeSheet('receiveNavigation'));
	dispatch(closeSheet('orangeTicket'));
	dispatch(addActivityItem(activityItem));

	await refreshLdk({ selectedWallet, selectedNetwork });
	updateSlashPayConfig({ selectedWallet, selectedNetwork });
};

/**
 * Subscribes to incoming lightning payments.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const subscribeToLightningPayments = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): void => {
	// if (!paymentPathSuccessSubscription) {
	// 	paymentPathSuccessSubscription = ldk.onEvent(
	// 		EEventTypes.channel_manager_payment_path_successful,
	// 		(_res: TChannelManagerPaymentPathSuccessful) => {},
	// 	);
	// }
	// if (!paymentPathFailedSubscription) {
	// 	paymentPathFailedSubscription = ldk.onEvent(
	// 		EEventTypes.channel_manager_payment_path_failed,
	// 		(_res: TChannelManagerPaymentPathFailed) => {},
	// 	);
	// }
	if (!paymentSentSubscription) {
		paymentSentSubscription = ldk.onEvent(
			EEventTypes.channel_manager_payment_sent,
			async (res: TChannelManagerPaymentSent) => {
				const pending = getLightningStore().pendingPayments;
				const found = pending.find((p) => p.payment_hash === res.payment_hash);

				if (found) {
					showToast({
						type: 'lightning',
						title: i18n.t('wallet:toast_payment_success_title'),
						description: i18n.t('wallet:toast_payment_success_description'),
					});
					await refreshLdk();
					bitkitLedger?.handleLNTx({ ...res, amount_sat: found.amount });
				} else {
					syncLedger(); // TChannelManagerPaymentSent doesn't have amount_sat
				}
			},
		);
	}
	if (!paymentFailedSubscription) {
		paymentFailedSubscription = ldk.onEvent(
			EEventTypes.channel_manager_payment_failed,
			async (res: TChannelManagerPaymentFailed) => {
				const pending = getLightningStore().pendingPayments;
				const found = pending.find((p) => p.payment_hash === res.payment_hash);

				if (found) {
					await refreshLdk({ selectedWallet, selectedNetwork });
					showToast({
						type: 'error',
						title: i18n.t('wallet:toast_payment_failed_title'),
						description: i18n.t('wallet:toast_payment_failed_description'),
					});
				}
			},
		);
	}
	if (!paymentClaimedSubscription) {
		paymentClaimedSubscription = ldk.onEvent(
			EEventTypes.channel_manager_payment_claimed,
			(res: TChannelManagerClaim) => {
				handleLightningPaymentSubscription({
					payment: res,
					selectedNetwork,
					selectedWallet,
				}).then();
				bitkitLedger?.handleLNTx(res);
			},
		);
	}
	if (!onChannelSubscription) {
		onChannelSubscription = ldk.onEvent(
			EEventTypes.new_channel,
			async (res: TChannelUpdate) => {
				await refreshLdk({ selectedWallet, selectedNetwork });

				const openChannels = getOpenChannels();
				const closedChannels = getClosedChannels();

				// If this is the first channel opened, show a toast
				if (openChannels.length === 1 && closedChannels.length === 0) {
					showToast({
						type: 'lightning',
						title: i18n.t('lightning:channel_opened_title'),
						description: i18n.t('lightning:channel_opened_msg'),
						visibilityTime: 5000,
					});
				}

				// Check if this is a CJIT Entry that needs to be added to the activity list.
				addCJitActivityItem(res.channel_id).then();
				syncLedger(); // we need to sync the ledger because TChannelUpdate doesn't have enough data
			},
		);
	}
	if (!onChannelClose) {
		onChannelClose = ldk.onEvent(
			EEventTypes.channel_manager_channel_closed,
			async (res: TChannelManagerChannelClosed) => {
				await closeChannelThunk(res);
				if (res.reason === EChannelClosureReason.CommitmentTxConfirmed) {
					// counterparty force closed the channel
					showBottomSheet('connectionClosed');
				}
				syncLedger(); // TChannelManagerChannelClosed is different from TChannelMonitor
			},
		);
	}
	// if (!onSpendableOutputsSubscription) {
	// 	onSpendableOutputsSubscription = ldk.onEvent(
	// 		EEventTypes.channel_manager_spendable_outputs,
	// 		() => {},
	// 	);
	// }
	if (!onBackupStateUpdate) {
		onBackupStateUpdate = ldk.onEvent(
			EEventTypes.backup_state_update,
			(res: TBackupStateUpdate) => {
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
	// paymentPathSuccessSubscription?.remove();
	// paymentPathFailedSubscription?.remove();
	paymentSentSubscription?.remove();
	paymentFailedSubscription?.remove();
	paymentClaimedSubscription?.remove();
	onChannelSubscription?.remove();
	onChannelClose?.remove();
	// onSpendableOutputsSubscription?.remove();
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
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
			lm.setFees(),
			addPeers({ selectedNetwork, selectedWallet }),
		];
		const results = await Promise.all(promises);
		// Handle & Return syncLdk errors.
		for (const result of results) {
			if (result.isErr()) {
				//setFees & addPeers can fail, but we should still continue and make UI ready so payments can be attempted
				console.error(
					`refreshLdk setFees/addPeers error: ${result.error.message}`,
				);
			}
		}

		const syncResult = await lm.syncLdk();
		if (syncResult.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('wallet:ldk_sync_error_title'),
				description: i18n.t('other:try_again'),
			});
			return handleRefreshError(syncResult.error.message);
		}

		await Promise.all([
			updateChannelsThunk(),
			syncLightningTxsWithActivityList(),
		]);

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
			name = `${name}${LDK_ACCOUNT_SUFFIX_V3}`;
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
 * Retrieve LDK account info from storage.
 * @param {number} version
 * @param {boolean} shouldCreateAccount When set to true, it will create a new account if none is found.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getLdkAccount = async ({
	version = 3, // v3 is the current and only supported version.
	shouldCreateAccount = true,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	version?: TLdkAccountVersion;
	shouldCreateAccount?: boolean;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<TAccount>> => {
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
	const bip39Passphrase = await getBip39Passphrase(selectedWallet);
	const name = getLdkAccountName({ selectedWallet, selectedNetwork });
	const defaultAccount = await getDefaultLdkAccount({
		name,
		mnemonic: mnemonicPhrase.value,
		bip39Passphrase,
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	version: TLdkAccountVersion;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<TAccount>> => {
	const name = getLdkAccountName({ selectedWallet, selectedNetwork });
	const result = await Keychain.getGenericPassword({ service: name });
	if (!!result && result?.password) {
		// Return existing account.
		return ok(JSON.parse(result.password));
	}
	return err('No LDK account found.');
};

/**
 * Retrieves LDK account name for the provided version, wallet and network.
 * @param {TLdkAccountVersion} version
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {string}
 */
export const getLdkAccountName = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string => {
	return `${selectedWallet}${selectedNetwork}${LDK_ACCOUNT_SUFFIX_V3}`;
};

/**
 * Returns the default LDK account for the provided name, mnemonic & version.
 * @param {string} name
 * @param {string} mnemonic
 * @param {TLdkAccountVersion} version
 * @returns {TAccount}
 */
export const getDefaultLdkAccount = async ({
	name,
	mnemonic,
	bip39Passphrase,
	version,
}: {
	name: string;
	mnemonic: string;
	bip39Passphrase: string;
	version: TLdkAccountVersion;
}): Promise<TAccount> => {
	if (version === 1 || version === 2) {
		await ldk.writeToLogFile(
			'error',
			'Default LDK accounts v1 and v2 have been deprecated for official public app store release. Creating v3 account.',
		);
	}

	return {
		name,
		seed: await ldkSeed(mnemonic, bip39Passphrase),
	};
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
	selectedNetwork: EAvailableNetwork = getSelectedNetwork(),
): Promise<THeader> => {
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
		times: 30,
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
		return err(i18n.t('lightning:error_add_uri'));
	}
	const parsed = uri[1].split(':');
	if (parsed.length < 2) {
		return err(i18n.t('lightning:error_add_uri'));
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

	const res = await lm.addPeer({
		pubKey: parsedUri.value.publicKey,
		address: parsedUri.value.ip,
		port: parsedUri.value.port,
		timeout,
	});

	if (res.isErr()) {
		res.error.message = i18n.t('lightning:error_add_msg', {
			raw: res.error.message,
		});
	}

	return res;
};

/**
 * Returns previously saved lightning peers from storage. (Excludes Blocktank and other default lightning peers.)
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 */
export const getCustomLightningPeers = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string[] => {
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<Result<string[]>> => {
	try {
		const geoBlocked = await isGeoBlocked(true);

		let blocktankNodeUris: string[] = [];
		// No need to add Blocktank peer if geo-blocked.
		if (!geoBlocked) {
			// Set Blocktank node uri array if able.
			for (const node of getBlocktankStore().info.nodes) {
				blocktankNodeUris.push(...node.connectionStrings);
			}
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Promise<string[]> => {
	try {
		const geoBlocked = await isGeoBlocked(true);

		let blocktankNodeUris: string[] = [];
		// No need to add Blocktank peer if geo-blocked.
		if (!geoBlocked) {
			// Set Blocktank node uri array if able.
			for (const node of getBlocktankStore().info.nodes) {
				blocktankNodeUris.push(...node.connectionStrings);
			}
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
export const getLdkChannels = (): Promise<Result<TLdkChannel[]>> => {
	return ldk.listChannels();
};

/**
 * Returns an array of closed channels
 * @returns Promise<Result<TChannelMonitor[]>>
 */
export const getChannelMonitors = async (
	ignoreOpenChannels: boolean = true,
): Promise<Result<TChannelMonitor[]>> => {
	return ldk.listChannelMonitors(ignoreOpenChannels);
};

/**
 * Returns an array of unconfirmed/pending lightning channels from either storage or directly from the LDK node.
 * CURRENTLY UNUSED
 * @param {boolean} [fromStorage]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<Result<TChannel[]>>}
 */
export const getChannels = (): TChannel[] => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();
	const node = getLightningStore().nodes[selectedWallet];
	const channels = node.channels[selectedNetwork];
	return Object.values(channels);
};

/**
 * Returns an array of confirmed/open lightning channels from redux store.
 * @returns {TChannel[]}
 */
export const getOpenChannels = (): TChannel[] => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	const node = getLightningStore().nodes[selectedWallet];
	const channels = node.channels[selectedNetwork];
	const openChannels = Object.values(channels).filter((channel) => {
		return channel.status === EChannelStatus.open;
	});

	return openChannels;
};

/**
 * Returns an array of closed lightning channels
 * @returns {TChannel[]}
 */
export const getClosedChannels = (): TChannel[] => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	const node = getLightningStore().nodes[selectedWallet];
	const channels = node.channels[selectedNetwork];
	const closedChannels = Object.values(channels).filter((channel) => {
		return channel.status === EChannelStatus.closed;
	});

	return closedChannels;
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
 * @param {boolean} [force]
 * @returns {Promise<Result<TChannel[]>>}
 */
export const closeAllChannels = async ({
	force = false,
}: {
	force?: boolean; // It will always try to coop close first and only force close if set to true.
} = {}): Promise<Result<TChannel[]>> => {
	const selectedWallet = getSelectedWallet();
	const selectedNetwork = getSelectedNetwork();

	try {
		// Ensure we're fully up-to-date.
		const refreshRes = await refreshLdk({ selectedWallet, selectedNetwork });
		if (refreshRes.isErr()) {
			return err(refreshRes.error.message);
		}

		// Force update fees before closing channels
		await refreshOnchainFeeEstimates({ forceUpdate: true });

		const channels = getOpenChannels();
		const channelsUnableToCoopClose: TChannel[] = [];
		await Promise.all(
			channels.map(async (channel) => {
				const { channel_id, counterparty_node_id } = channel;
				const closeResponse = await closeChannel({
					channelId: channel_id,
					counterPartyNodeId: counterparty_node_id,
					force,
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
 * @param {number} [amount]
 * @returns {Promise<Result<string>>}
 */
export const payLightningInvoice = async ({
	invoice,
	amount,
}: {
	invoice: string;
	amount?: number;
}): Promise<Result<string>> => {
	try {
		const addPeersResponse = await addPeers();
		if (addPeersResponse.isErr()) {
			return err(addPeersResponse.error.message);
		}

		const payPromise = lm.payWithTimeout({
			paymentRequest: invoice,
			amountSats: amount,
			timeout: 60000,
		});

		const payResponse = await promiseTimeout<
			Result<TChannelManagerPaymentSent>
		>(PAYMENT_TIMEOUT, payPromise);

		refreshLdk().then();

		if (payResponse.isErr()) {
			return err(payResponse.error.message);
		}

		return ok(payResponse.value.payment_hash);
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
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

export const rebroadcastAllKnownTransactions = async (): Promise<any> => {
	return await lm.rebroadcastAllKnownTransactions();
};

export const recoverOutputs = async (): Promise<Result<string>> => {
	return await lm.recoverOutputs();
};

export const recoverOutputsFromForceClose = async (): Promise<
	Result<string>
> => {
	return await lm.recoverOutputsFromForceClose();
};

/**
 * Returns total reserve balance for all open lightning channels.
 * @returns {number}
 */
export const getLightningReserveBalance = (): number => {
	const openChannels = getOpenChannels();
	const result = reduceValue(openChannels, 'unspendable_punishment_reserve');
	const reserveBalance = result.isOk() ? result.value : 0;
	return reserveBalance;
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string[] => {
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
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<Result<string>> => {
	const getChannelsResponse = await getLdkChannels();
	if (getChannelsResponse.isErr()) {
		return err(getChannelsResponse.error.message);
	}
	const channels = getChannelsResponse.value;
	const channelNodeIds = channels.map(
		(channel) => channel.counterparty_node_id,
	);
	const blocktankInfo = await getBlocktankInfo(true);
	const blocktankPubKeys = blocktankInfo.nodes.map((n) => n.pubkey);
	const peers = await lm.getPeers();

	await Promise.all(
		peers.map((peer) => {
			if (
				!channelNodeIds.includes(peer.pubKey) && // If no channels exist for a given peer, remove them.
				!blocktankPubKeys.includes(peer.pubKey) // Ensure we don't disconnect from Blocktank if it was previously added as a peer.
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
 * @param {boolean} [includeReserve] Whether or not to include each channel's reserve balance (~1% per channel participant) in the returned balance.
 * @returns {{ localBalance: number; remoteBalance: number; }}
 */
export const getLightningBalance = ({
	includeReserve = true,
}: {
	includeReserve?: boolean;
} = {}): {
	localBalance: number;
	remoteBalance: number;
} => {
	const openChannels = getOpenChannels();

	let localBalance = 0;
	let remoteBalance = 0;

	openChannels.forEach((channel) => {
		const localReserve = channel.unspendable_punishment_reserve ?? 0;
		localBalance += includeReserve
			? channel.outbound_capacity_sat + localReserve
			: channel.outbound_capacity_sat;

		remoteBalance += channel.inbound_capacity_sat;
	});

	return { localBalance, remoteBalance };
};
