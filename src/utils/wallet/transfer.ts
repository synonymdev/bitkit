import { IFormattedTransaction } from 'beignet';
import { getCurrentWallet } from '.';
import { btcToSats } from '../conversion';
import { getTransactions } from './electrum';
import { ETransferType, TTransfer } from '../../store/types/wallet';

/**
 * Get the transfer object for a given transaction if it exists
 * @param {tx} IFormattedTransaction
 */
export const getTransferForTx = async (
	tx: IFormattedTransaction,
): Promise<TTransfer | undefined> => {
	const { currentWallet, selectedNetwork } = getCurrentWallet();
	const transfers = currentWallet.transfers[selectedNetwork];

	const transfer = transfers.find((t) => {
		// check if the tx is a transfer to spending
		const isTransferToSpending = t.txId === tx.txid;
		if (isTransferToSpending) {
			return true;
		}

		// if the funding tx is in the transfer list it's a mutual close
		const txInput = tx.vin.find((vin) => t.txId === vin.txid);
		if (txInput) {
			return true;
		}
	});

	if (transfer) {
		return transfer;
	}

	// If we haven't found a transfer yet, check if the tx is a sweep from a force close
	// check that tx amount matches first to avoid unnecessary Electrum calls
	const inputValue = btcToSats(tx.totalInputValue);
	const matched = transfers.filter((t) => {
		return t.type === ETransferType.forceClose && t.amount === inputValue;
	});

	if (matched.length > 0) {
		// call Electrum to check if the tx has a parent that funded a channel
		// if so the tx is probably a sweep from a force close
		const txResponse = await getTransactions({
			txHashes: [{ tx_hash: tx.vin[0].txid }],
		});
		if (txResponse.isOk()) {
			const txData = txResponse.value.data;
			if (txData.length !== 0) {
				const parentTx = txData[0].result;
				return matched.find((t) => t.txId === parentTx.vin[0].txid);
			}
		}
	}
};
