import { ok, Result } from '@synonymdev/result';
import actions from './actions';
import { getDispatch, getMetaDataStore } from '../helpers';
import { getCurrentWallet } from '../../utils/wallet';
import { EPaymentType } from '../types/wallet';
import { removeKeysFromObject } from '../../utils/helpers';
import { TTags } from '../types/metadata';

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
 * This action updates transactions tags
 */
export const updateMetaIncTxTags = (
	address: string,
	payReq: string,
	tags: Array<string> = [],
): Result<string> => {
	dispatch({
		type: actions.UPDATE_META_INC_TX_TAGS,
		payload: { address, payReq, tags },
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
	const { tags, pendingTags } = getMetaDataStore();

	// Find all incoming transactions that we have pending tags for
	const matchedTxs = Object.values(transactions).filter(
		(tx) => tx.type === EPaymentType.received && !!pendingTags[tx.address],
	);
	const matchedAddresses = matchedTxs.map((tx) => tx.address);

	// move matched from pendingTags to tags
	const newPendingTags = removeKeysFromObject(pendingTags, matchedAddresses);
	const newTags = matchedTxs
		.filter((tx) => !Object.keys(tags).includes(tx.txid))
		.map((tx) => ({ [tx.txid]: pendingTags[tx.address] }));

	const newTagsObj: TTags = Object.assign({}, ...newTags);

	dispatch({
		type: actions.MOVE_META_INC_TX_TAG,
		payload: {
			tags: newTagsObj,
			pendingTags: newPendingTags,
		},
	});

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
