import { BitkitLedger } from 'ledger';
import { err, ok, Result } from '@synonymdev/result';

import { storage as mmkv } from '../store/mmkv-storage';
import {
	getClaimedLightningPayments,
	getSentLightningPayments,
} from './lightning';
import { getWalletStore } from '../store/helpers';
import { getSelectedNetwork, getSelectedWallet } from './wallet';

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
		const txLenBefore = bitkitLedger.ledger.getTransactions().length;
		// lightning
		const sent = await getSentLightningPayments();
		console.info('sent', sent)
		const received = await getClaimedLightningPayments();
		bitkitLedger.syncLNHistory({ sent, received });

		// onchain
		const selectedWallet = getSelectedWallet();
		const selectedNetwork = getSelectedNetwork();
		const onchain =
			getWalletStore().wallets[selectedWallet].transactions[selectedNetwork];
		bitkitLedger.syncOnchainHistory(onchain);

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
