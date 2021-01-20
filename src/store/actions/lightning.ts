import actions from './actions';
import {
	ICreateLightningWallet,
	IUnlockLightningWallet,
} from '../types/lightning';
import { getDispatch } from '../helpers';
import lnd from 'react-native-lightning';
import LndConf from 'react-native-lightning/dist/lnd.conf';
import { ENetworks as LndNetworks } from 'react-native-lightning/dist/types';
import { connectToDefaultPeer, getCustomLndConf } from '../../utils/lightning';
import { err, ok, Result } from '../../utils/result';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';
import { lnrpc } from 'react-native-lightning/dist/rpc';

const dispatch = getDispatch();


/**
 * Starts the LND service
 * @param network
 * @returns {Promise<unknown>}
 */
export const startLnd = (network: LndNetworks): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const stateRes = await lnd.currentState();
		if (stateRes.isOk() && stateRes.value.lndRunning) {
			await dispatch({
				type: actions.UPDATE_LIGHTNING_STATE,
				payload: stateRes.value,
			});

			return resolve(ok('LND already started')); //Already running
		}

		const lndConf = new LndConf(network, getCustomLndConf(network));

		const res = await lnd.start(lndConf);
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await refreshLightningState();
		lnd.subscribeToCurrentState((state) => {
			dispatch({
				type: actions.UPDATE_LIGHTNING_STATE,
				payload: state,
			});
		});

		resolve(ok('LND started'));
	});
};

/**
 * Creates a new LND wallet
 * @param password
 * @param mnemonic
 * @param network
 * @returns {Promise<unknown>}
 */
export const createLightningWallet = ({
	password,
	mnemonic,
	network,
}: ICreateLightningWallet): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const existsRes = await lnd.walletExists(network);
		if (existsRes.isOk() && existsRes.value) {
			return resolve(err('LND wallet already exists'));
		}

		let lndSeed: string[] = [];
		if (mnemonic) {
			lndSeed = mnemonic.split(' ');
		} else {
			const seedRes = await lnd.genSeed();
			if (seedRes.isErr()) {
				return resolve(err(seedRes.error));
			}

			lndSeed = seedRes.value;
		}

		const createRes = await lnd.createWallet(password, lndSeed);
		if (createRes.isErr()) {
			return resolve(err(createRes.error));
		}
		await dispatch({
			type: actions.CREATE_LIGHTNING_WALLET,
		});

		//Attempt to connect to default peer from the start so it's ready when the channel needs to be opened
		await connectToDefaultPeer();

		subscribeToLndUpdates().then();

		resolve(ok('LND wallet created'));
	});
};

/**
 * Unlocks an existing LND wallet if one exists
 * @param password
 * @param network
 * @returns {Promise<unknown>}
 */
export const unlockLightningWallet = ({
	password,
	network,
}: IUnlockLightningWallet): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const stateRes = await lnd.currentState();
		if (stateRes.isOk() && stateRes.value.grpcReady) {
			subscribeToLndUpdates().then();
			return resolve(ok('Wallet already unlocked')); //Wallet already unlocked
		}

		const existsRes = await lnd.walletExists(network);
		if (existsRes.isOk() && !existsRes.value) {
			return resolve(err('LND wallet does not exist'));
		}

		const unlockRes = await lnd.unlockWallet(password);
		if (unlockRes.isErr()) {
			return resolve(err(unlockRes.error));
		}

		await dispatch({
			type: actions.UNLOCK_LIGHTNING_WALLET,
		});

		subscribeToLndUpdates().then();

		resolve(ok('Wallet unlocked'));
	});
};

/**
 * Updates the lightning store with the latest state of LND
 * @returns {(dispatch) => Promise<unknown>}
 */
export const refreshLightningState = (): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await lnd.currentState();
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await dispatch({
			type: actions.UPDATE_LIGHTNING_STATE,
			payload: res.value,
		});
		resolve(ok('LND state refreshed'));
	});
};

/**
 * Updates the lightning store with the latest GetInfo response from LND
 * @returns {(dispatch) => Promise<unknown>}
 */
export const refreshLightningInfo = (): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await lnd.getInfo();
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await dispatch({
			type: actions.UPDATE_LIGHTNING_INFO,
			payload: res.value,
		});
		resolve(ok('LND info refreshed'));
	});
};

/**
 * Updates the lightning store with the latest WalletBalance response from LND
 * TODO: Should be removed when on chain wallet is ready to replace the built in LND wallet
 * @returns {(dispatch) => Promise<unknown>}
 */
export const refreshLightningOnChainBalance = (): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await lnd.getWalletBalance();
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await dispatch({
			type: actions.UPDATE_LIGHTNING_ON_CHAIN_BALANCE,
			payload: res.value,
		});
		resolve(ok('LND on chain balance refreshed'));
	});
};

export const refreshLightningInvoices = (): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		//TODO we might need to optimise with pagination later using indexOffset and numMaxInvoices
		const res = await lnd.listInvoices();
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await dispatch({
			type: actions.UPDATE_LIGHTNING_INVOICES,
			payload: res.value,
		});
		resolve(ok('LND invoices refreshed'));
	});
};

/**
 * Updates the lightning store with the latest ChannelBalance response from LND
 * @returns {(dispatch) => Promise<unknown>}
 */
export const refreshLightningChannelBalance = (): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await lnd.getChannelBalance();
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		await dispatch({
			type: actions.UPDATE_LIGHTNING_CHANNEL_BALANCE,
			payload: res.value,
		});

		resolve(ok('LND channel balance refreshed'));
	});
};

const subscribeToLndUpdates = async (): Promise<void> => {
	//If grpc hasn't even started yet wait and try again
	const stateRes = await lnd.currentState();
	if (stateRes.isOk() && !stateRes.value.grpcReady) {
		setTimeout(subscribeToLndUpdates, 1000);
		return;
	}

	//Poll for the calls we can't subscribe to
	await Promise.all([pollLndGetInfo(), refreshLightningInvoices()]);

	lnd.subscribeToInvoices(
		async (res) => {
			if (res.isOk()) {
				const { value, memo, settled } = res.value;
				if (!settled) {
					//Not interested in newly created invoices
					return;
				}

				showSuccessNotification({
					title: `Received ${value} sats`,
					message: `Invoice for "${memo}" was paid`,
				});

				await Promise.all([
					refreshLightningChannelBalance(),
					refreshLightningInvoices(),
				]);
			}
		},
		(res) => {
			//If this fails ever then we probably need to subscribe again
			showErrorNotification({
				title: 'Failed to subscribe to invoices',
				message: JSON.stringify(res),
			});
		},
	);

	//TODO when LND's on-chain transactions are not needed then remove this
	lnd.subscribeToOnChainTransactions(
		(res) => {
			if (res.isOk()) {
				const { amount } = res.value;

				refreshLightningOnChainBalance();

				showSuccessNotification({
					title: `Received ${amount} sats`,
					message: 'Paid on-chain',
				});
			}
		},
		(res) => {
			//If this fails ever then we probably need to subscribe again
			showErrorNotification({
				title: 'Failed to subscribe to on chain transactions',
				message: JSON.stringify(res),
			});
		},
	);
};

let pollLndGetInfoTimeout;
/**
 * Keeps polling the LND service so values are kept up to date.
 * TODO: Attempt to subscribe to some of these requests instead of polling
 * @returns {Promise<void>}
 */
const pollLndGetInfo = async (): Promise<void> => {
	clearTimeout(pollLndGetInfoTimeout); //If previously subscribed make sure we don't keep have more than 1

	await Promise.all([
		refreshLightningInfo(),
		refreshLightningOnChainBalance(),
		refreshLightningChannelBalance(),
	]);

	pollLndGetInfoTimeout = setTimeout(pollLndGetInfo, 3000);
};

/**
 * Pay lightning invoice and refresh channel balances after successful payment
 * @param invoice
 * @returns {Promise<{error: boolean, data: string}>}
 */
export const payLightningRequest = (
	invoice: string,
): Promise<Result<lnrpc.IRoute>> => {
	return new Promise(async (resolve) => {
		const res = await lnd.payInvoice(invoice);
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		if (res.value.paymentError) {
			return resolve(err(new Error(res.value.paymentError)));
		}

		await refreshLightningChannelBalance();

		//paymentRoute exists when there is no paymentError
		resolve(ok(res.value.paymentRoute!));
	});
};
