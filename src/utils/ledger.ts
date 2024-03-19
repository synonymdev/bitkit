import { BitkitLedger } from 'ledger';
import { err, ok, Result } from '@synonymdev/result';

import { storage as mmkv } from '../store/mmkv-storage';
import {
	getClaimedLightningPayments,
	getLightningChannels,
	getSentLightningPayments,
} from './lightning';
import { getWalletStore } from '../store/helpers';
import { getSelectedNetwork, getSelectedWallet } from './wallet';
import { getTransactions } from './wallet/electrum';

const MMKV_LEDGER_KEY = 'ledger';

export let bitkitLedger: BitkitLedger | undefined;

export const initLedger = async (): Promise<Result<string>> => {
	// try to restore the ledger from storage
	try {
		const restored = mmkv.getString(MMKV_LEDGER_KEY);
		const newLedger = new BitkitLedger();

		if (restored) {
			newLedger.ledger.jsonLoad(restored);
		} else {
			newLedger.initEmptyLedger();
		}
		bitkitLedger = newLedger;
	} catch (e) {
		return err(e);
	}

	return ok('ledger init success');
};

export const saveLedger = async (): Promise<Result<string>> => {
	if (!bitkitLedger) {
		return ok('ledger not initialized');
	}

	try {
		mmkv.set('ledger', bitkitLedger.ledger.jsonDump());
	} catch (e) {
		return err(e);
	}

	return ok('ledger save success');
};

export const syncLedger = async (): Promise<Result<string>> => {
	if (!bitkitLedger) {
		return ok('ledger not initialized');
	}

	try {
		// onchain
		const selectedWallet = getSelectedWallet();
		const selectedNetwork = getSelectedNetwork();
		const onchain =
			getWalletStore().wallets[selectedWallet].transactions[selectedNetwork];
		const txLenBefore = bitkitLedger.ledger.getTransactions().length;
		// lightning
		const lnSent = await getSentLightningPayments();
		const lnClaim = await getClaimedLightningPayments();
		// lightning channels
		const cResp = await getLightningChannels();
		if (cResp.isErr()) {
			return err(cResp.error.message);
		}
		const channels = cResp.value;
		const txsResp = await getTransactions({
			txHashes: channels
				.filter((c) => Boolean(c.funding_txid))
				.map((c) => ({ tx_hash: c.funding_txid! })),
		});
		if (txsResp.isErr()) {
			return err(txsResp.error.message);
		}
		const channelsWithTimestap = channels.map((c) => {
			const tx = txsResp.value.data.find(
				(t) => t.data.tx_hash === c.funding_txid,
			);
			if (!tx) {
				throw new Error('tx not found');
			}
			if (!tx.result.time) {
				throw new Error('tx time not found');
			}
			return {
				...c,
				timestamp: tx.result.time * 1000,
			};
		});

		// sync
		bitkitLedger.syncHistory({
			lnClaim,
			lnSent,
			onchain,
			channels: channelsWithTimestap,
		});

		const txLenAfter = bitkitLedger.ledger.getTransactions().length;
		if (txLenAfter > txLenBefore) {
			const save = await saveLedger();
			if (save.isErr()) {
				return err(save.error);
			}
		}
	} catch (e) {
		return err(e);
	}
	return ok('ledger sync success');
};

export const resetLedger = async (): Promise<Result<string>> => {
	if (!bitkitLedger) {
		return ok('ledger not initialized');
	}

	try {
		mmkv.delete(MMKV_LEDGER_KEY);
		bitkitLedger = undefined;
	} catch (e) {
		return err(e);
	}

	return ok('ledger reset success');
};
