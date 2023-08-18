import { ok, Result } from '@synonymdev/result';
import actions from './actions';
import { getDispatch, getMetaDataStore } from '../helpers';
import { getCurrentWallet } from '../../utils/wallet';
import { EPaymentType } from '../types/wallet';
import { IMetadata } from '../types/metadata';

const dispatch = getDispatch();

/*
 * This action updates transactions tags
 */
export const updateMetaTxTags = (
	txid: string,
	tags: Array<string> = [],
): Result<string> => {
	dispatch({
		type: actions.UPDATE_META_TX_TAGS,
		payload: { txid, tags },
	});
	return ok('');
};

/*
 * This action adds transaction tag
 */
export const addMetaTxTag = (txid: string, tag: string): Result<string> => {
	dispatch({
		type: actions.ADD_META_TX_TAG,
		payload: { txid, tag },
	});
	return ok('');
};

/*
 * This action removes transaction tag
 */
export const deleteMetaTxTag = (txid: string, tag: string): Result<string> => {
	dispatch({
		type: actions.DELETE_META_TX_TAG,
		payload: { txid, tag },
	});
	return ok('');
};

/*
 * This action updates a pending invoice
 */
export const updatePendingInvoice = (payload: {
	id: string;
	tags: string[];
	address: string;
	payReq?: string;
}): Result<string> => {
	dispatch({
		type: actions.UPDATE_PENDING_INVOICE,
		payload,
	});
	return ok('');
};

/*
 * This action deletes a pending invoice
 */
export const removePendingInvoice = (id: string): Result<string> => {
	dispatch({
		type: actions.DELETE_PENDING_INVOICE,
		payload: id,
	});
	return ok('');
};

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

		dispatch({
			type: actions.MOVE_META_INC_TX_TAG,
			payload: {
				pendingInvoices: newPending,
				tags: { [matched.txid]: matchedInvoice.tags },
			},
		});
	}

	return ok('Metadata tags resynced with transactions.');
};

/*
 * This action adds transaction SlashTagsURL
 */
export const addMetaSlashTagsUrlTag = (
	txid: string,
	slashTagsUrl: string,
): Result<string> => {
	dispatch({
		type: actions.ADD_META_TX_SLASH_TAGS_URL,
		payload: { txid, slashTagsUrl },
	});
	return ok('');
};

/*
 * This action removes transaction SlashTagsURL
 */
export const deleteMetaSlashTagsUrlTag = (txid: string): Result<string> => {
	dispatch({
		type: actions.DELETE_META_TX_SLASH_TAGS_URL,
		payload: { txid },
	});
	return ok('');
};

/*
 * This action save new tag to the last used list
 */
export const addTag = (tag: string): Result<string> => {
	dispatch({
		type: actions.ADD_TAG,
		payload: { tag },
	});
	return ok('');
};

/*
 * This action deletes a tag from the last used list
 */
export const deleteTag = (tag: string): Result<string> => {
	dispatch({
		type: actions.DELETE_TAG,
		payload: tag,
	});
	return ok('');
};

/*
 * This resets the metadata store to defaultMetadataShape
 */
export const resetMetaStore = (): Result<string> => {
	dispatch({ type: actions.RESET_META_STORE });
	return ok('');
};

export const updateMetadata = (payload: Partial<IMetadata>): Result<string> => {
	dispatch({
		type: actions.UPDATE_META,
		payload,
	});
	return ok('');
};
