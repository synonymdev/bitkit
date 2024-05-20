import { ok, Result } from '@synonymdev/result';
import { TChannel } from '@synonymdev/react-native-ldk';
import { EPaymentType } from 'beignet';

import { EActivityType, TLightningActivityItem } from '../types/activity';
import { getBlocktankStore, dispatch } from '../helpers';
import { vibrate } from '../../utils/helpers';
import { getCurrentWallet } from '../../utils/wallet';
import { getChannels } from '../../utils/lightning';
import { formatBoostedActivityItems } from '../../utils/boost';
import { onChainTransactionToActivityItem } from '../../utils/activity';
import { checkPendingCJitEntries } from './blocktank';
import { updateSettings } from '../slices/settings';
import { closeSheet } from '../slices/ui';
import { addActivityItem, updateActivityItems } from '../slices/activity';
import { showBottomSheet } from './ui';

/**
 * Attempts to determine if a given channel open was in response to
 * a CJIT entry and adds it to the activity list accordingly.
 * @param {string} channelId
 */
export const addCJitActivityItem = async (channelId: string): Promise<void> => {
	const channels = getChannels();
	const channel = channels.find((c: TChannel) => c.channel_id === channelId);
	if (!channel) {
		return; // Channel not found.
	}
	if (channel.confirmations_required !== 0 || channel.balance_sat === 0) {
		return; // No need to take action.
	}

	// Update any pending CJIT entries.
	await checkPendingCJitEntries();

	// Check if we have a CJIT entry for this channel.
	const cJitEntry = getBlocktankStore().cJitEntries.find((entry) => {
		return entry?.channel?.fundingTx.id === channel.funding_txid;
	});
	if (!cJitEntry) {
		// No CJIT entry found for this channel.
		// Most likely a normal channel open.
		return;
	}

	const activityItem: TLightningActivityItem = {
		id: channel.funding_txid ?? '',
		activityType: EActivityType.lightning,
		txType: EPaymentType.received,
		status: 'successful',
		message: '',
		address: cJitEntry.invoice.request,
		value: channel.balance_sat,
		confirmed: true,
		timestamp: new Date().getTime(),
	};

	dispatch(addActivityItem(activityItem));
	dispatch(updateSettings({ hideOnboardingMessage: true }));
	dispatch(closeSheet('receiveNavigation'));
	vibrate({ type: 'default' });
	showBottomSheet('newTxPrompt', { activityItem });
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
export const updateOnChainActivityList = async (): Promise<Result<string>> => {
	let { currentWallet } = getCurrentWallet();
	if (!currentWallet) {
		console.warn(
			'No wallet found. Cannot update activity list with transactions.',
		);
		return ok('');
	}
	const { selectedNetwork, selectedWallet } = getCurrentWallet();
	const boostedTransactions =
		currentWallet.boostedTransactions[selectedNetwork];

	const transactions = currentWallet.transactions[selectedNetwork];
	const promises = Object.values(transactions).map(async (tx) => {
		return await onChainTransactionToActivityItem({ transaction: tx });
	});
	const activityItems = await Promise.all(promises);

	const boostFormattedItems = formatBoostedActivityItems({
		items: activityItems,
		boostedTransactions,
		selectedWallet,
		selectedNetwork,
	});
	dispatch(updateActivityItems(boostFormattedItems));

	return ok('On chain transaction activity items updated');
};
