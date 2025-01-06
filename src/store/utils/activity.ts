import { TChannel } from '@synonymdev/react-native-ldk';
import { ok, Result } from '@synonymdev/result';
import { EPaymentType } from 'beignet';

import { onChainTransactionToActivityItem } from '../../utils/activity';
import { formatBoostedActivityItems } from '../../utils/boost';
import { vibrate } from '../../utils/helpers';
import { getOpenChannels, getPendingChannels } from '../../utils/lightning';
import { getCurrentWallet } from '../../utils/wallet';
import { dispatch, getBlocktankStore } from '../helpers';
import { addActivityItem, updateActivityItems } from '../slices/activity';
import { updateSettings } from '../slices/settings';
import { closeSheet } from '../slices/ui';
import { EActivityType, TLightningActivityItem } from '../types/activity';
import { showBottomSheet } from './ui';
import { persistor } from '..';

/**
 * Attempts to determine if a given channel open was in response to
 * a CJIT entry and adds it to the activity list accordingly.
 * @param {string} channelId
 */
export const addCJitActivityItem = async (channelId: string): Promise<void> => {
	const pendingChannels = getPendingChannels();
	const openChannels = getOpenChannels();
	const channels = [...pendingChannels, ...openChannels];
	const channel = channels.find((c: TChannel) => c.channel_id === channelId);
	if (!channel) {
		console.log('CJIT activity item not added. Channel not found.');
		return;
	}
	if (channel.confirmations_required !== 0 || channel.balance_sat === 0) {
		console.log('CJIT activity item not added. Channel empty.');
		return;
	}

	// Try to find the CJIT entry for this channel by channel size.
	const cJitEntries = getBlocktankStore().cJitEntries;
	const cJitEntry = cJitEntries.find((entry) => {
		return entry.channelSizeSat === channel.channel_value_satoshis;
	});

	if (!cJitEntry) {
		// Most likely a normal channel open.
		console.log('CJIT activity item not added. No entry found.');
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

	// redux-persist doesn't save to MMKV when the app is backgrounded
	// Quickfix: manually flush the store after adding the activity item
	// TODO: fix setTimeout & setInterval to work in the background
	await persistor.flush();
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
	const { selectedNetwork } = getCurrentWallet();
	const boostedTransactions =
		currentWallet.boostedTransactions[selectedNetwork];

	const transactions = currentWallet.transactions[selectedNetwork];
	const promises = Object.values(transactions).map(async (tx) => {
		return await onChainTransactionToActivityItem({ transaction: tx });
	});
	const activityItems = await Promise.all(promises);

	const boostFormattedItems = await formatBoostedActivityItems({
		items: activityItems,
		boostedTransactions,
	});
	dispatch(updateActivityItems(boostFormattedItems));

	return ok('On chain transaction activity items updated');
};
