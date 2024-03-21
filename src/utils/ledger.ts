import { err, ok, Result } from '@synonymdev/result';
import { BitkitLedger } from 'ledger';

import { getWalletStore } from '../store/helpers';
import { storage as mmkv } from '../store/mmkv-storage';
import { TWalletName } from '../store/types/wallet';
import {
	getClaimedLightningPayments,
	getLightningChannels,
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
