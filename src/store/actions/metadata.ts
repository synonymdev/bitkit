import { ok, Result } from '@synonymdev/result';
import actions from './actions';
import { getDispatch, getStore } from '../helpers';
import { getCurrentWallet } from '../../utils/wallet';

const dispatch = getDispatch();

/*
 * This resets the metadata store to defaultMetadataShape
 */
export const resetMetaStore = (): Result<string> => {
	dispatch({ type: actions.RESET_META_STORE });
	return ok('');
};

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
	const store = getStore();
	const { selectedWallet, selectedNetwork } = getCurrentWallet({});
	if (!store.wallet.wallets[selectedWallet]) {
		console.warn('No wallet found. Cannot update metadata with transactions.');
		return ok('');
	}

	const transactions =
		store.wallet.wallets[selectedWallet].transactions[selectedNetwork];

	const receivedTxs = Object.entries(transactions).filter(
		([_, txContent]) => txContent.type === 'received',
	);

	const { tags, pendingTags } = store.metadata;
	const pendingAddresses = Object.keys(pendingTags);

	const matchedTxs = receivedTxs.filter(([_, txContent]) =>
		pendingAddresses.find((address) => address === txContent.address),
	);

	const matchedAddresses = matchedTxs.map(
		([_, txContent]) => txContent.address,
	);

	const newPendingTags = pendingAddresses
		.filter((key) => !matchedAddresses.includes(key))
		.reduce((obj, key) => {
			return Object.assign(obj, {
				[key]: pendingTags[key],
			});
		}, {});

	const newTags = matchedTxs
		.filter(([_, txContent]) => !Object.keys(tags).includes(txContent.txid))
		.map(([_, txContent]) => ({
			[txContent.txid]: pendingTags[txContent.address],
		}));

	const newTagsObj = Object.assign({}, ...newTags);

	dispatch({
		type: actions.MOVE_META_INC_TX_TAG,
		payload: { tags: newTagsObj, pendingTags: newPendingTags },
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
