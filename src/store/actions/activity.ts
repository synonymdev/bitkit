import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import { IActivityItem } from '../types/activity';
import { getBlocktankStore, getDispatch } from '../helpers';
import { onChainTransactionToActivityItem } from '../../utils/activity';
import { getCurrentWallet } from '../../utils/wallet';
import { formatBoostedActivityItems } from '../../utils/boost';

const dispatch = getDispatch();

/**
 * Adds the provided activity item to the activity list.
 * @param {IActivityItem<TActivityItems>} activityItem
 * @returns {Result<string>}
 */
export const addActivityItem = (
	activityItem: IActivityItem,
): Result<string> => {
	dispatch({
		type: actions.ADD_ACTIVITY_ITEM,
		payload: activityItem,
	});
	return ok('Activity Item Added.');
};

/**
 * @param {string} id
 * @param {IActivityItem} newActivityItem
 */
export const updateActivityItem = (
	id: string,
	data: Partial<IActivityItem>,
): void => {
	dispatch({
		type: actions.UPDATE_ACTIVITY_ITEM,
		payload: { id, data },
	});
};

/**
 * Updates activity list with all wallet stores
 * @returns {Promise<Result<string>>}
 */
export const updateActivityList = (): Result<string> => {
	updateOnChainActivityList();
	return ok('Activity items updated');
};

/**
 * Converts on-chain transactions to activity items and saves them to store
 * @returns {Promise<Result<string>>}
 */
export const updateOnChainActivityList = (): Result<string> => {
	const { currentWallet, selectedNetwork, selectedWallet } = getCurrentWallet(
		{},
	);
	const blocktankTransactions = getBlocktankStore().paidOrders;
	const boostedTransactions =
		currentWallet.boostedTransactions[selectedNetwork];

	if (!currentWallet) {
		console.warn(
			'No wallet found. Cannot update activity list with transactions.',
		);
		return ok('');
	}

	const transactions = currentWallet.transactions[selectedNetwork];
	const activityItems = Object.values(transactions).map((tx) => {
		return onChainTransactionToActivityItem({
			transaction: tx,
			blocktankTransactions,
		});
	});

	const boostFormattedItems = formatBoostedActivityItems({
		items: activityItems,
		boostedTransactions,
		selectedWallet,
		selectedNetwork,
	});

	dispatch({
		type: actions.UPDATE_ACTIVITY_ENTRIES,
		payload: boostFormattedItems,
	});

	return ok('On chain transaction activity items updated');
};

/*
 * This resets the activity store to defaultActivityShape
 */
export const resetActivityStore = (): Result<string> => {
	dispatch({ type: actions.RESET_ACTIVITY_STORE });
	return ok('');
};
