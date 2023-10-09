import { ok, Result } from '@synonymdev/result';

import actions from './actions';
import {
	EActivityType,
	IActivityItem,
	TLightningActivityItem,
} from '../types/activity';
import { getBlocktankStore, getDispatch } from '../helpers';
import { onChainTransactionToActivityItem } from '../../utils/activity';
import { getCurrentWallet } from '../../utils/wallet';
import { formatBoostedActivityItems } from '../../utils/boost';
import { TChannel } from '@synonymdev/react-native-ldk';
import { EPaymentType } from '../types/wallet';
import { closeBottomSheet, showBottomSheet } from './ui';
import { checkPendingCJitEntries } from './blocktank';
import { getLightningChannels } from '../../utils/lightning';
import { updateSettings } from './settings';

const dispatch = getDispatch();

/**
 * Adds the provided activity item to the activity list.
 * @param {IActivityItem} activityItem
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
 * Attempts to determine if a given channel open was in response to
 * a CJIT entry and adds it to the activity list accordingly.
 * @param {string} channelId
 */
export const addCJitActivityItem = async (channelId: string): Promise<void> => {
	const lightningChannels = await getLightningChannels();
	if (lightningChannels.isErr()) {
		return;
	}
	const lightningChannel = lightningChannels.value.find(
		(channel: TChannel) => channel.channel_id === channelId,
	);
	if (!lightningChannel) {
		return; // Channel not found.
	}
	if (
		lightningChannel.confirmations_required !== 0 ||
		lightningChannel.balance_sat === 0
	) {
		return; // No need to take action.
	}

	// Update any pending CJIT entries.
	await checkPendingCJitEntries();

	// Check if we have a CJIT entry for this channel.
	const cJitEntry = getBlocktankStore().cJitEntries.find((entry) => {
		return entry?.channel?.fundingTx.id === lightningChannel.funding_txid;
	});
	if (!cJitEntry) {
		// No CJIT entry found for this channel.
		// Most likely a normal channel open.
		return;
	}

	const activityItem: TLightningActivityItem = {
		id: lightningChannel?.funding_txid ?? '',
		activityType: EActivityType.lightning,
		txType: EPaymentType.received,
		message: '',
		address: cJitEntry.invoice.request,
		value: lightningChannel.balance_sat,
		confirmed: true,
		timestamp: new Date().getTime(),
	};
	addActivityItem(activityItem);
	updateSettings({
		hideOnboardingMessage: true,
	});
	closeBottomSheet('receiveNavigation');
	showBottomSheet('newTxPrompt', { activityItem });
};

export const addActivityItems = (
	activityItems: IActivityItem[],
): Result<string> => {
	dispatch({
		type: actions.ADD_ACTIVITY_ITEMS,
		payload: activityItems,
	});
	return ok('Activity Item Added.');
};

/**
 * @param {string} id
 * @param {Partial<IActivityItem>} data
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
 * @returns {Result<string>}
 */
export const updateActivityList = (): Result<string> => {
	updateOnChainActivityList();
	return ok('Activity items updated');
};

/**
 * Converts on-chain transactions to activity items and saves them to store
 * @returns {Result<string>}
 */
export const updateOnChainActivityList = (): Result<string> => {
	const { currentWallet, selectedNetwork, selectedWallet } = getCurrentWallet();
	const blocktankTransactions = getBlocktankStore().paidOrders;
	const blocktankOrders = getBlocktankStore().orders;
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
			blocktankOrders,
		});
	});

	const boostFormattedItems = formatBoostedActivityItems({
		items: activityItems,
		boostedTransactions,
		selectedWallet,
		selectedNetwork,
	});

	dispatch({
		type: actions.UPDATE_ACTIVITY_ITEMS,
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
