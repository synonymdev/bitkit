import { err, ok, Result } from '@synonymdev/result';
import { BitkitLedger } from 'ledger';

import { getWalletStore } from '../store/helpers';
import { storage as mmkv } from '../store/mmkv-storage';
import { TWalletName } from '../store/types/wallet';
import {
	getClaimedLightningPayments,
	getChannelMonitors,
	getLdkChannels,
	getSentLightningPayments,
} from './lightning';
import { EAvailableNetwork } from './networks';
import { getSelectedNetwork, getSelectedWallet } from './wallet';
import { getTransactions } from './wallet/electrum';

const MMKV_LEDGER_KEY = 'ledger';

export let bitkitLedger: BitkitLedger | undefined;

export const setupLedger = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
} = {}): Result<string> => {
	// try to restore the ledger from storage
	try {
		const key = `${MMKV_LEDGER_KEY}-${selectedNetwork}-${selectedWallet}`;
		const restored = mmkv.getString(key);
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

	return ok('ledger setup success');
};

export const saveLedger = (): Result<string> => {
	if (!bitkitLedger) {
		return ok('ledger not initialized');
	}

	try {
		const selectedWallet = getSelectedWallet();
		const selectedNetwork = getSelectedNetwork();
		const key = `${MMKV_LEDGER_KEY}-${selectedNetwork}-${selectedWallet}`;
		mmkv.set(key, bitkitLedger.ledger.jsonDump());
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
		// onchain transactions
		const selectedWallet = getSelectedWallet();
		const selectedNetwork = getSelectedNetwork();
		const onchain =
			getWalletStore().wallets[selectedWallet].transactions[selectedNetwork];
		const txLenBefore = bitkitLedger.ledger.getTransactions().length;

		// lightning transactions
		const lnSent = await getSentLightningPayments();
		const lnClaim = await getClaimedLightningPayments();

		// lightning open channels
		const oResp = await getLdkChannels();
		if (oResp.isErr()) {
			return err(oResp.error.message);
		}
		const open = oResp.value;

		// lightning close channels
		const cResp = await getChannelMonitors();
		if (cResp.isErr()) {
			return err(cResp.error.message);
		}
		const close = cResp.value;

		const txsResp = await getTransactions({
			txHashes: [
				...open
					.filter((c) => Boolean(c.funding_txid))
					.map((c) => ({ tx_hash: c.funding_txid! })),
				...close.map((o) => ({ tx_hash: o.funding_txo })),
			],
		});
		if (txsResp.isErr()) {
			return err(txsResp.error.message);
		}
		const lnChannelOpen = open.map((c) => {
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
		const lnChannelClose = close.map((c) => {
			const tx = txsResp.value.data.find(
				(t) => t.data.tx_hash === c.funding_txo,
			);
			console.info('txsResp', tx);
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
			lnChannelOpen,
			lnChannelClose,
		});

		const txLenAfter = bitkitLedger.ledger.getTransactions().length;
		if (txLenAfter > txLenBefore) {
			const save = saveLedger();
			if (save.isErr()) {
				return err(save.error);
			}
		}
	} catch (e) {
		return err(e);
	}
	return ok('ledger sync success');
};

export const deleteLedger = (): Result<string> => {
	try {
		const keys = mmkv.getAllKeys().filter((k) => k.startsWith(MMKV_LEDGER_KEY));
		for (const key of keys) {
			mmkv.delete(key);
		}
		bitkitLedger = undefined;
	} catch (e) {
		return err(e);
	}

	return ok('ledger delete success');
};
