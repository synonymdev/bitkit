import { BitkitLedger } from '@synonymdev/ledger';
import { TChannelMonitor } from '@synonymdev/react-native-ldk';
import { err, ok, Result } from '@synonymdev/result';
import { IAddress } from 'beignet';
import RNFS, { unlink, writeFile } from 'react-native-fs';
import Share from 'react-native-share';

import { getWalletStore } from '../store/helpers';
import { storage as mmkv } from '../store/mmkv-storage';
import { TWalletName } from '../store/types/wallet';
import {
	getChannelMonitors,
	getClaimedLightningPayments,
	getLdkChannels,
	getSentLightningPayments,
} from './lightning';
import { EAvailableNetwork } from './networks';
import {
	getOnChainWalletElectrum,
	getScriptHash,
	getSelectedNetwork,
	getSelectedWallet,
} from './wallet';
import { getTransactions } from './wallet/electrum';

const MMKV_LEDGER_KEY = 'ledger';

export let bitkitLedger: BitkitLedger | undefined;

const channelIdToTxId = (channelId: string): string => {
	return Buffer.from(channelId, 'hex').reverse().toString('hex');
};

export const getChannelCloseTime = async (
	channel: TChannelMonitor,
): Promise<Result<number>> => {
	const { funding_txo_txid, funding_txo_index } = channel;
	const selectedNetwork = getSelectedNetwork();
	const txsResp = await getTransactions({
		txHashes: [{ tx_hash: funding_txo_txid }],
	});
	if (txsResp.isErr()) {
		return err(txsResp.error.message);
	}
	const fundingTx = txsResp.value.data[0];
	if (!fundingTx) {
		return err('tx not found');
	}

	// search for channel address
	const vout = fundingTx.result.vout[funding_txo_index];
	if (!vout) {
		return err('channel address not found');
	}
	const address = vout.scriptPubKey.address;
	if (!address) {
		return err('channel address not found');
	}

	// we have to construct IAddress to get the history
	const scriptHash = await getScriptHash(address, selectedNetwork);
	const el = getOnChainWalletElectrum();
	const scriptHashes: IAddress[] = [
		{
			index: 0,
			path: 'path',
			address: address,
			scriptHash,
			publicKey: 'publicKey',
		},
	];
	const history = await el.getAddressHistory({ scriptHashes });
	if (history.isErr()) {
		return err(history.error.message);
	}

	// there should be 2 transactions: funding and closing
	if (history.value.length !== 2) {
		return err('unexpected history length');
	}

	// find close tx
	history.value.sort((a, b) => b.height - a.height);
	const closeTxid = history.value[0].tx_hash;
	const closeTxsResp = await getTransactions({
		txHashes: [{ tx_hash: closeTxid }],
	});
	if (closeTxsResp.isErr()) {
		return err(closeTxsResp.error.message);
	}
	const closeTx = closeTxsResp.value.data[0];
	if (!closeTx) {
		return err('close tx not found');
	}
	if (!closeTx.result.time) {
		return err('close tx time not found');
	}
	return ok(closeTx.result.time * 1000);
};

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
				...close.map((o) => ({ tx_hash: channelIdToTxId(o.channel_id) })),
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

		// map channel close to timestamps
		const lnChannelClose = await Promise.all(
			close.map(async (c) => {
				const time = await getChannelCloseTime(c);
				if (time.isErr()) {
					throw time.error;
				}
				return {
					...c,
					timestamp: time.value,
				};
			}),
		);

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

export const exportLedger = async (): Promise<Result<string>> => {
	const time = new Date().getTime();
	if (!bitkitLedger) {
		return ok('ledger not initialized');
	}

	try {
		const dump = bitkitLedger.ledger.jsonDump();
		const filePath = `${RNFS.DocumentDirectoryPath}/ledger_${time}.json`;
		await writeFile(filePath, dump, 'utf8');

		// Export file
		await Share.open({
			title: 'Export Bitkit Store',
			type: 'application/json',
			url: `file://${filePath}`,
		});

		// Delete file from app storage
		await unlink(filePath);
	} catch (e) {
		return err(e);
	}

	return ok('ledger export success');
};
