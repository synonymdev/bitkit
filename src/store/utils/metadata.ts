import { Result, ok } from '@synonymdev/result';
import { EPaymentType } from 'beignet';
import { getCurrentWallet } from '../../utils/wallet';
import { dispatch, getMetaDataStore } from '../helpers';
import { moveMetaIncTxTag } from '../slices/metadata';

/**
 * Moves pending tags to metadata store linked to received transactions
 * @returns {Result<string>}
 */
export const moveMetaIncTxTags = (): Result<string> => {
	const { selectedNetwork, currentWallet } = getCurrentWallet();
	if (!currentWallet) {
		console.warn('No wallet found. Cannot update metadata with transactions.');
		return ok('');
	}

	const transactions = currentWallet.transactions[selectedNetwork];
	const { pendingInvoices } = getMetaDataStore();

	// Find received transaction that matches a pending invoice
	const matched = Object.values(transactions).find((tx) => {
		return pendingInvoices.find((invoice) => {
			const isReceived = tx.type === EPaymentType.received;
			return isReceived && tx.address === invoice.address;
		});
	});

	// Find pending invoice that matches the transaction
	const matchedInvoice = pendingInvoices.find((item) => {
		return matched?.address === item.address;
	});

	if (matched && matchedInvoice) {
		const newPending = pendingInvoices.filter((item) => {
			return item !== matchedInvoice;
		});

		dispatch(
			moveMetaIncTxTag({
				pendingInvoices: newPending,
				tags: { [matched.txid]: matchedInvoice.tags },
			}),
		);
	}

	return ok('Metadata tags resynced with transactions.');
};
